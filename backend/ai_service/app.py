import os
import io
import time
import re
import hashlib
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from PIL import Image
from contextlib import asynccontextmanager
from huggingface_hub import InferenceClient

# ── Config ────────────────────────────────────────────────
HF_TOKEN = os.environ.get("HF_TOKEN", "")
HF_TEXT_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
HF_IMAGE_MODEL = "openai/clip-vit-base-patch32"

# InferenceClient handles URL routing, retries, and auth automatically
client = InferenceClient(token=HF_TOKEN) if HF_TOKEN else InferenceClient()


# ── Fallback Embeddings ───────────────────────────────────

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
    img = image.convert("RGB").resize((64, 64), Image.Resampling.BILINEAR)
    arr = np.array(img, dtype=np.float32)
    bins = dim // 4  # 128 bins per channel
    r_hist, _ = np.histogram(arr[:, :, 0], bins=bins, range=(0, 255))
    g_hist, _ = np.histogram(arr[:, :, 1], bins=bins, range=(0, 255))
    b_hist, _ = np.histogram(arr[:, :, 2], bins=bins, range=(0, 255))
    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    l_hist, _ = np.histogram(lum, bins=bins, range=(0, 255))
    combined = np.concatenate([r_hist, g_hist, b_hist, l_hist]).astype(np.float32)
    norm = np.linalg.norm(combined)
    return (combined / norm).tolist() if norm > 0 else combined.tolist()


# ── HF InferenceClient calls ──────────────────────────────

def _hf_text_embed(text: str):
    try:
        result = client.feature_extraction(text, model=HF_TEXT_MODEL)
        # result is a numpy array — flatten to 1D list
        vec = np.array(result, dtype=np.float32).flatten()
        if vec.size > 10:
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            return vec.tolist(), "sentence-transformer"
    except Exception as e:
        print(f"HF text InferenceClient error: {e}")
    return None, None


def _hf_image_embed(image_bytes: bytes):
    try:
        result = client.feature_extraction(image_bytes, model=HF_IMAGE_MODEL)
        vec = np.array(result, dtype=np.float32).flatten()
        if vec.size > 10:
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            # Pad or truncate to 512 dims
            if len(vec) < 512:
                vec = np.pad(vec, (0, 512 - len(vec)))
            else:
                vec = vec[:512]
            return vec.tolist(), "clip"
    except Exception as e:
        print(f"HF image InferenceClient error: {e}")
    return None, None


# ── Startup ───────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 AI service starting (HF InferenceClient mode)...")
    if not HF_TOKEN:
        print("⚠️  No HF_TOKEN set — using unauthenticated HF API (rate limited).")
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
        "mode": "hf-inference-client",
        "hf_authenticated": bool(HF_TOKEN),
        "models": {
            "text": HF_TEXT_MODEL,
            "image": HF_IMAGE_MODEL
        }
    }


@app.get("/warmup")
def warmup():
    results = {}
    try:
        result = client.feature_extraction("warmup test sentence", model=HF_TEXT_MODEL)
        vec = np.array(result, dtype=np.float32).flatten()
        results["text_model"] = f"ready (dim={vec.size})"
    except Exception as e:
        results["text_model"] = f"error: {str(e)[:300]}"
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
        print("⚠️  HF text embed failed — using fallback hash embedding")
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
        print("⚠️  HF image embed failed — using color histogram fallback")
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
    try:
        contents = await file.read()
        Image.open(io.BytesIO(contents)).convert("RGB")
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
