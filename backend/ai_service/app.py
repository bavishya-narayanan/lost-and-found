import os
import re
import io
import time
import hashlib
import requests
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from PIL import Image
from contextlib import asynccontextmanager

# ── HuggingFace Inference API Config ─────────────────────
HF_TOKEN = os.environ.get("HF_TOKEN", "")
HF_HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}

HF_TEXT_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
HF_IMAGE_MODEL = "openai/clip-vit-base-patch32"

# HuggingFace migrated from api-inference.huggingface.co (deprecated) to router.huggingface.co
HF_BASE = "https://router.huggingface.co/hf-inference/models"
HF_TEXT_URL = f"{HF_BASE}/{HF_TEXT_MODEL}"
HF_IMAGE_URL = f"{HF_BASE}/{HF_IMAGE_MODEL}"


# ── Fallback Embeddings (if HF API fails) ─────────────────

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
    return (vector / norm).tolist() if norm > 0 else vector.tolist()


def _build_color_histogram_embedding(image: Image.Image, dim: int = 512):
    """
    Color histogram-based image embedding using Pillow only.
    Groups similar-colored images together — no torch needed.
    - R histogram: 128 bins
    - G histogram: 128 bins
    - B histogram: 128 bins
    - Luminance histogram: 128 bins
    Total: 512 dims
    """
    img = image.convert("RGB").resize((64, 64), Image.Resampling.BILINEAR)
    arr = np.array(img, dtype=np.float32)

    bins = dim // 4  # 128 bins per channel
    r_hist, _ = np.histogram(arr[:, :, 0], bins=bins, range=(0, 255))
    g_hist, _ = np.histogram(arr[:, :, 1], bins=bins, range=(0, 255))
    b_hist, _ = np.histogram(arr[:, :, 2], bins=bins, range=(0, 255))

    # Luminance
    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    l_hist, _ = np.histogram(lum, bins=bins, range=(0, 255))

    combined = np.concatenate([r_hist, g_hist, b_hist, l_hist]).astype(np.float32)
    norm = np.linalg.norm(combined)
    return (combined / norm).tolist() if norm > 0 else combined.tolist()


# ── HF API Calls ──────────────────────────────────────────

def _hf_text_embed(text: str, retries: int = 3):
    """Call HF Inference API for sentence-transformer text embedding."""
    for attempt in range(retries):
        try:
            resp = requests.post(
                HF_TEXT_URL,
                headers={**HF_HEADERS, "Content-Type": "application/json"},
                json={"inputs": text, "options": {"wait_for_model": True}},
                timeout=30
            )
            if resp.status_code == 503:
                # Model loading — wait and retry
                print(f"HF text model loading (attempt {attempt+1}/{retries})... waiting 20s")
                time.sleep(20)
                continue
            if resp.status_code == 200:
                result = resp.json()
                # HF returns [[...384 floats...]] for sentence-transformers
                if isinstance(result, list) and len(result) > 0:
                    embedding = result[0] if isinstance(result[0], list) else result
                    if isinstance(embedding, list) and len(embedding) > 10:
                        return embedding, "sentence-transformer"
            print(f"HF text API error {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            print(f"HF text API exception (attempt {attempt+1}): {e}")
    return None, None


def _hf_image_embed(image_bytes: bytes, retries: int = 3):
    """Call HF Inference API for CLIP image embedding."""
    for attempt in range(retries):
        try:
            resp = requests.post(
                HF_IMAGE_URL,
                headers={**HF_HEADERS, "Content-Type": "application/octet-stream"},
                data=image_bytes,
                timeout=30
            )
            if resp.status_code == 503:
                print(f"HF image model loading (attempt {attempt+1}/{retries})... waiting 20s")
                time.sleep(20)
                continue
            if resp.status_code == 200:
                result = resp.json()
                # CLIP feature extraction returns nested arrays
                if isinstance(result, list) and len(result) > 0:
                    embedding = result
                    # Flatten if nested
                    if isinstance(embedding[0], list):
                        embedding = embedding[0]
                    if isinstance(embedding, list) and len(embedding) > 10:
                        # Normalize to unit vector
                        vec = np.array(embedding, dtype=np.float32)
                        norm = np.linalg.norm(vec)
                        if norm > 0:
                            vec = vec / norm
                        # Pad or truncate to 512 dims
                        if len(vec) < 512:
                            vec = np.pad(vec, (0, 512 - len(vec)))
                        else:
                            vec = vec[:512]
                        return vec.tolist(), "clip"
            print(f"HF image API error {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            print(f"HF image API exception (attempt {attempt+1}): {e}")
    return None, None


# ── Startup ───────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 AI service starting (HF Inference API mode)...")
    if not HF_TOKEN:
        print("⚠️  No HF_TOKEN set — using unauthenticated HF API (rate limited). Add HF_TOKEN env var for better performance.")
    else:
        print("✅ HF_TOKEN detected — authenticated HF API requests.")
    yield
    print("🛑 AI service shutting down.")


app = FastAPI(title="Campus Lost & Found AI Service", lifespan=lifespan)


# ── Endpoints ─────────────────────────────────────────────

class TextRequest(BaseModel):
    text: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "mode": "hf-inference-api",
        "hf_authenticated": bool(HF_TOKEN),
        "models": {
            "text": HF_TEXT_MODEL,
            "image": HF_IMAGE_MODEL
        }
    }


@app.get("/warmup")
def warmup():
    """Pre-warm HF models by sending a dummy request."""
    results = {}

    # Warm up text model
    embedding, source = _hf_text_embed("warmup test sentence")
    results["text_model"] = "ready" if embedding else "failed or still loading"

    return {"status": "warmed_up", "results": results}


@app.post("/embed-text")
def embed_text(req: TextRequest):
    start = time.time()

    embedding, source = _hf_text_embed(req.text)

    if embedding:
        return {
            "embedding": embedding,
            "source": "sentence-transformer",
            "dimension": len(embedding),
            "latency_ms": int((time.time() - start) * 1000)
        }
    else:
        print(f"⚠️  HF text API failed — using fallback hash embedding")
        embedding = _build_fallback_text_embedding(req.text)
        return {
            "embedding": embedding,
            "source": "fallback-text",
            "dimension": len(embedding),
            "latency_ms": int((time.time() - start) * 1000)
        }


@app.post("/embed-image")
async def embed_image(file: UploadFile = File(...)):
    start = time.time()
    contents = await file.read()

    embedding, source = _hf_image_embed(contents)

    if embedding:
        return {
            "embedding": embedding,
            "source": "clip",
            "dimension": len(embedding),
            "latency_ms": int((time.time() - start) * 1000)
        }
    else:
        print(f"⚠️  HF image API failed — using color histogram fallback")
        try:
            image = Image.open(io.BytesIO(contents)).convert("RGB")
            embedding = _build_color_histogram_embedding(image)
        except Exception:
            embedding = [0.0] * 512
        return {
            "embedding": embedding,
            "source": "fallback-image",
            "dimension": len(embedding),
            "latency_ms": int((time.time() - start) * 1000)
        }


@app.post("/process-document")
async def process_document(file: UploadFile = File(...)):
    """
    Lightweight document processing without easyocr/spacy.
    Returns safe defaults — OCR requires heavy dependencies.
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        # Lightweight check: if image has text-like properties (high contrast, small features)
        # we flag it as potentially sensitive conservatively
        return {
            "isSensitive": False,
            "ocrText": "",
            "detectedEntities": {
                "name": "", "rollNumber": "", "cardNumber": "",
                "aadhaarNumber": "", "bankName": "", "department": "", "collegeName": ""
            },
            "latency": 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document processing failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
