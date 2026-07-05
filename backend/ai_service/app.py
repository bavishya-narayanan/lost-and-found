import os
import re
import io
import time
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from PIL import Image
import torch
import open_clip
from sentence_transformers import SentenceTransformer
import easyocr
import spacy

app = FastAPI(title="Campus Lost & Found AI Service")

# Initialize models
print("Loading OpenCLIP model (ViT-B-32)...")
clip_model, _, clip_preprocess = open_clip.create_model_and_transforms('ViT-B-32', pretrained='laion2b_s34b_b79k')
clip_model.eval()

print("Loading Sentence Transformer (all-MiniLM-L6-v2)...")
text_model = SentenceTransformer('all-MiniLM-L6-v2')

print("Loading EasyOCR...")
ocr_reader = easyocr.Reader(['en'])

print("Loading spaCy model...")
try:
    nlp = spacy.load('en_core_web_sm')
except OSError:
    print("spaCy en_core_web_sm not found, will download it.")
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load('en_core_web_sm')

class TextRequest(BaseModel):
    text: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/embed-image")
async def embed_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        processed_image = clip_preprocess(image).unsqueeze(0)
        
        with torch.no_grad():
            image_features = clip_model.encode_image(processed_image)
            image_features /= image_features.norm(dim=-1, keepdim=True)
            embedding = image_features[0].cpu().numpy().tolist()
            
        return {"embedding": embedding}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image embedding failed: {str(e)}")

@app.post("/embed-text")
def embed_text(req: TextRequest):
    try:
        embedding = text_model.encode(req.text).tolist()
        return {"embedding": embedding}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text embedding failed: {str(e)}")

@app.post("/process-document")
async def process_document(file: UploadFile = File(...)):
    try:
        start_time = time.time()
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
        # e.g., if we extract at least 8 alphanumeric characters
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

            # Expose Bank details via regex keywords
            bank_keywords = ["sbi", "hdfc", "icici", "axis", "canara", "bank", "cooperative"]
            for word in bank_keywords:
                if word in ocr_text.lower():
                    # Simple extraction: find surrounding words
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
            # Running OpenCLIP zero-shot object classification to confirm normal object
            is_sensitive = False
            # (In standard flow, if no text is found, it's just marked non-sensitive)

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
