import os
import re
import io
import time
import hashlib
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from PIL import Image

app = FastAPI(title="Campus Lost & Found AI Service")

# ── Lazy-loaded model globals ─────────────────────────────
_clip_model = None
_clip_preprocess = None
_text_model = None
_ocr_reader = None
_nlp = None


def get_clip():
    global _clip_model, _clip_preprocess
    if _clip_model is None:
        import torch
        import open_clip
        print("Loading OpenCLIP model (ViT-B-32)...")
        _clip_model, _, _clip_preprocess = open_clip.create_model_and_transforms(
            'ViT-B-32', pretrained='laion2b_s34b_b79k'
        )
        _clip_model.eval()
    return _clip_model, _clip_preprocess


def get_text_model():
    global _text_model
    if _text_model is None:
        from sentence_transformers import SentenceTransformer
        print("Loading Sentence Transformer (all-MiniLM-L6-v2)...")
        _text_model = SentenceTransformer('all-MiniLM-L6-v2')
    return _text_model


def get_ocr():
    global _ocr_reader
    if _ocr_reader is None:
        import easyocr
        print("Loading EasyOCR...")
        _ocr_reader = easyocr.Reader(['en'])
    return _ocr_reader


def get_nlp():
    global _nlp
    if _nlp is None:
        import spacy
        print("Loading spaCy model...")
        try:
            _nlp = spacy.load('en_core_web_sm')
        except OSError:
            print("spaCy en_core_web_sm not found, downloading...")
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
            _nlp = spacy.load('en_core_web_sm')
    return _nlp


def _build_fallback_text_embedding(text: str, dim: int = 384):
    normalized = re.sub(r"[^a-z0-9]+", " ", (text or "").lower()).strip()
    tokens = normalized.split() if normalized else ["fallback"]
    vector = np.zeros(dim, dtype=np.float32)

    for index, token in enumerate(tokens):
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        bucket = int.from_bytes(digest[:2], "big") % dim
        vector[bucket] += 0.35 + min(0.65, index * 0.01)
        bucket2 = (bucket + 17 + (index % 11)) % dim
        vector[bucket2] += 0.1

    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm
    return vector.tolist()


def _build_fallback_image_embedding(image: Image.Image, dim: int = 512):
    resized = image.convert("RGB").resize((32, 32), Image.Resampling.BILINEAR)
    arr = np.array(resized, dtype=np.float32) / 255.0
    flat = arr.reshape(-1)

    if flat.size >= dim:
        step = max(1, flat.size // dim)
        selected = flat[::step][:dim]
        if selected.size < dim:
            selected = np.pad(selected, (0, dim - selected.size))
    else:
        selected = np.pad(flat, (0, dim - flat.size))

    norm = np.linalg.norm(selected)
    if norm > 0:
        selected = selected / norm
    return selected.astype(np.float32).tolist()


class TextRequest(BaseModel):
    text: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/embed-image")
async def embed_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        import torch
        clip_model, clip_preprocess = get_clip()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        processed_image = clip_preprocess(image).unsqueeze(0)

        with torch.no_grad():
            image_features = clip_model.encode_image(processed_image)
            image_features /= image_features.norm(dim=-1, keepdim=True)
            embedding = image_features[0].cpu().numpy().tolist()

        return {"embedding": embedding, "source": "clip"}
    except Exception as e:
        try:
            image = Image.open(io.BytesIO(contents)).convert("RGB")
            embedding = _build_fallback_image_embedding(image)
            return {"embedding": embedding, "source": "fallback-image"}
        except Exception as fallback_error:
            return {"embedding": [0.0] * 512, "source": "fallback-image-error"}


@app.post("/embed-text")
def embed_text(req: TextRequest):
    try:
        text_model = get_text_model()
        embedding = text_model.encode(req.text).tolist()
        return {"embedding": embedding, "source": "sentence-transformer"}
    except Exception as e:
        embedding = _build_fallback_text_embedding(req.text)
        return {"embedding": embedding, "source": "fallback-text"}


@app.post("/process-document")
async def process_document(file: UploadFile = File(...)):
    try:
        start_time = time.time()
        ocr_reader = get_ocr()
        nlp = get_nlp()
        contents = await file.read()

        # 1. Run EasyOCR
        ocr_result = ocr_reader.readtext(contents)
        ocr_text = " ".join([res[1] for res in ocr_result]).strip()

        is_sensitive = False
        detected_entities = {
            "name": "",
            "rollNumber": "",
            "cardNumber": "",
            "aadhaarNumber": "",
            "bankName": "",
            "department": "",
            "collegeName": ""
        }

        # Determine if "meaningful document text" is detected
        clean_text_len = len(re.sub(r'\W+', '', ocr_text))

        if clean_text_len >= 8:
            is_sensitive = True

            # 2. Extract Entities - Regex Part
            # Aadhaar: 12 digits, optional spaces
            aadhaar_match = re.search(r'\b\d{4}\s?\d{4}\s?\d{4}\b', ocr_text)
            if aadhaar_match:
                detected_entities["aadhaarNumber"] = aadhaar_match.group(0)

            # Card Number: 16 digits
            card_match = re.search(r'\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b', ocr_text)
            if card_match:
                detected_entities["cardNumber"] = card_match.group(0)

            # Roll Number: e.g. 22IT115, 20CSE10, 19ECE03
            roll_match = re.search(r'\b\d{2}[a-zA-Z]{2,4}\d{2,4}\b', ocr_text)
            if roll_match:
                detected_entities["rollNumber"] = roll_match.group(0).upper()

            # Bank details via regex keywords
            bank_keywords = ["sbi", "hdfc", "icici", "axis", "canara", "bank", "cooperative"]
            for word in bank_keywords:
                if word in ocr_text.lower():
                    match = re.search(rf'([A-Za-z\s]+{word}[A-Za-z\s]*)', ocr_text, re.IGNORECASE)
                    if match:
                        detected_entities["bankName"] = match.group(0).strip().title()
                        break

            # 3. Extract Entities - spaCy NER Part
            doc = nlp(ocr_text)

            # Names (PERSON)
            names = [ent.text for ent in doc.ents if ent.label_ == "PERSON"]
            if names:
                detected_entities["name"] = names[0].strip().title()

            # Organizations/Colleges
            orgs = [ent.text for ent in doc.ents if ent.label_ in ["ORG", "FAC"]]
            for org in orgs:
                org_lower = org.lower()
                if "college" in org_lower or "university" in org_lower or "institute" in org_lower or "engg" in org_lower or "engineering" in org_lower:
                    detected_entities["collegeName"] = org.strip().title()
                elif "department" in org_lower or "dept" in org_lower or "science" in org_lower or "technology" in org_lower:
                    detected_entities["department"] = org.strip().title()

            # Rule fallback for department/college if NER misses them
            if not detected_entities["collegeName"]:
                col_match = re.search(r'([A-Za-z\s]+(?:College|University|Institute|School)[A-Za-z\s]*)', ocr_text, re.IGNORECASE)
                if col_match:
                    detected_entities["collegeName"] = col_match.group(0).strip().title()

            if not detected_entities["department"]:
                dept_match = re.search(r'([A-Za-z\s]+(?:Department|Dept|Branch)[A-Za-z\s]*)', ocr_text, re.IGNORECASE)
                if dept_match:
                    detected_entities["department"] = dept_match.group(0).strip().title()

        else:
            is_sensitive = False

        return {
            "isSensitive": is_sensitive,
            "ocrText": ocr_text,
            "detectedEntities": detected_entities,
            "latency": int((time.time() - start_time) * 1000)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document processing failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
