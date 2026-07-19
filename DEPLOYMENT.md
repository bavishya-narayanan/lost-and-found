# 🚀 Findit — Complete Deployment Guide

> **Campus Lost & Found Platform** — Full-stack deployment reference.
> This document covers every external service used, why it is needed, how it was set up, and how all pieces connect together.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  USER BROWSER                       │
└──────────────────────┬──────────────────────────────┘
                       │  HTTPS
                       ▼
┌─────────────────────────────────────────────────────┐
│            VERCEL  (Frontend)                       │
│   React + Vite SPA · vercel.json SPA rewrites       │
│   https://your-app.vercel.app                       │
└──────────────────────┬──────────────────────────────┘
                       │  REST API + WebSocket (Socket.io)
                       ▼
┌─────────────────────────────────────────────────────┐
│            RENDER  (Backend — Node.js)              │
│   Express API · Socket.io · port 5000               │
│   https://findit-backend-1pei.onrender.com          │
└────┬──────────┬──────────┬──────────┬───────────────┘
     │          │          │          │
┌────▼──┐  ┌───▼────┐  ┌──▼─────┐  ┌▼────────────────┐
│MongoDB│  │Cloudina│  │Qdrant  │  │Render           │
│Atlas  │  │ry(Imgs)│  │Cloud   │  │(FastAPI Python) │
└───────┘  └────────┘  │(Vectors│  └───────┬─────────┘
                       └────────┘          │
                                    ┌──────▼──────┐
                                    │Hugging Face │
                                    │Inference API│
                                    └─────────────┘
```

---

## 🧩 Service-by-Service Breakdown

---

### 1. 🟢 Vercel — Frontend Hosting

**URL:** `https://your-app.vercel.app`
**What it hosts:** React + Vite Single Page Application (SPA)

#### Why Vercel?
- Zero-config deployment for Vite/React projects
- Automatic HTTPS, global CDN, instant cache invalidation on deploy
- Free tier is generous for campus-scale traffic
- Native Git integration — every push to `main` auto-deploys

#### What was deployed
The entire `frontend/` folder is a Vite + React SPA:
- **React Router** — client-side page navigation
- **Socket.io-client** — real-time chat with Render backend
- **Axios** — all REST API calls to Render backend
- **Leaflet + react-leaflet** — interactive campus map
- **Tailwind CSS v4** — styling
- **Framer Motion** — animations

#### How it was set up
1. vercel.com → New Project → Import from GitHub
2. Select `lost-and-found` repo
3. Set Root Directory: `frontend`
4. Vercel auto-detects Vite → Build: `npm run build`, Output: `dist`
5. Add Environment Variables:
   ```
   VITE_API_URL     = https://findit-backend-1pei.onrender.com/api
   VITE_BACKEND_URL = https://findit-backend-1pei.onrender.com
   ```
6. Deploy

#### Key config — `frontend/vercel.json`
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```
> **Why this matters:** Without this, a direct URL like `/dashboard` returns 404
> because Vercel looks for a real file. The rewrite sends all routes to `index.html`
> so React Router handles navigation.

#### Frontend Environment Variables
| Variable | Value | Purpose |
|---|---|---|
| `VITE_API_URL` | `.../api` | Base URL for all REST API calls |
| `VITE_BACKEND_URL` | `...onrender.com` | Base URL for Socket.io connection |

---

### 2. 🟣 Render — Backend (Node.js Express API)

**URL:** `https://findit-backend-1pei.onrender.com`
**What it hosts:** Express.js REST API + Socket.io WebSocket server

#### Why Render (not Vercel)?
- **Socket.io requires a persistent server** — Vercel is serverless and cannot hold WebSocket connections
- Render runs Node.js as a long-running process
- Free tier, Git-based auto-deploy on push to `main`

#### What it runs on startup (`server.js`)
1. Connects to MongoDB Atlas
2. Initializes Qdrant Cloud vector collections (`text_embeddings`, `image_embeddings`)
3. Checks FastAPI AI service health
4. Starts Express on `process.env.PORT` (Render injects this automatically)
5. Starts Socket.io on same HTTP server

#### API Routes
| Route | Purpose |
|---|---|
| `/api/auth/*` | Register, login, logout, verify email |
| `/api/lost-items` | Create & browse lost item reports |
| `/api/found-items` | Create & browse found item reports |
| `/api/search` | Semantic vector search |
| `/api/matches` | View AI-generated matches |
| `/api/notifications` | User notification inbox |
| `/api/recovery` | Item handover recovery sessions |
| `/api/chat` | In-app messaging |

#### How it was set up on Render
1. render.com → New → Web Service → Connect GitHub
2. Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Environment: Node
6. Add all environment variables (table below)

#### Backend Environment Variables (on Render)
| Variable | Value | Purpose |
|---|---|---|
| `PORT` | `5000` | Express port (Render overrides) |
| `MONGO_URI` | `mongodb+srv://...` | MongoDB Atlas connection string |
| `JWT_SECRET` | `findit_campus_super_secret...` | Signs/verifies JWT auth tokens |
| `JWT_EXPIRE` | `7d` | Token lifetime |
| `QDRANT_URL` | `https://6a7c6202-...qdrant.io` | Qdrant Cloud endpoint |
| `QDRANT_API_KEY` | `eyJhbGci...` | Qdrant Cloud API key |
| `AI_SERVICE_URL` | `https://findit-ai-service.onrender.com` | FastAPI URL (also Render) |
| `CLOUDINARY_CLOUD_NAME` | `im1yxufu` | Cloudinary account |
| `CLOUDINARY_API_KEY` | `234924619879931` | Cloudinary key |
| `CLOUDINARY_API_SECRET` | `VyITuduo-...` | Cloudinary secret |
| `CLIENT_URL` | `https://your-app.vercel.app` | CORS + Socket.io allowlist |
| `HF_TOKEN` | `hf_TAWQ...` | Hugging Face token |

> ⚠️ CORS only accepts requests from `CLIENT_URL`. Update this if Vercel URL changes.

---

### 3. 🟠 Render — AI Service (Python FastAPI)

**URL:** `https://findit-ai-service.onrender.com`
**What it hosts:** FastAPI Python microservice for ML embeddings

#### Why a separate Python service?
- Node.js cannot run Python ML libraries (HuggingFace, PyTorch)
- FastAPI is the standard high-performance framework for ML serving
- Separate service means it can be scaled or replaced independently

#### FastAPI Endpoints
| Endpoint | Method | What it does |
|---|---|---|
| `/health` | GET | Returns model mode and HF auth status |
| `/warmup` | GET | Pre-warms HuggingFace model connection |
| `/embed-text` | POST | Text → 384-dim sentence embedding vector |
| `/embed-image` | POST | Image file → 512-dim CLIP embedding vector |
| `/process-document` | POST | OCR + entity extraction on image |

#### How it was set up on Render
1. New Web Service → same repo
2. Root Directory: `backend/ai_service`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app:app --host 0.0.0.0 --port 8000`
5. Environment: Python 3
6. Add: `HF_TOKEN = hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`  ← your token from huggingface.co

#### Python dependencies (`requirements.txt`)
```
fastapi
uvicorn[standard]
python-multipart
pydantic
Pillow
numpy
requests
huggingface_hub
```
> No PyTorch or heavy ML libraries — all inference is delegated to HF API.
> This keeps deploy time fast and the image small.

#### Fallback behaviour
If HF API is unreachable or rate-limited:
- **Text:** deterministic SHA-256 hash-based embedding
- **Image:** RGB colour histogram embedding

---

### 4. 🤗 Hugging Face — Inference API (ML Models)

**Used by:** FastAPI AI service on Render
**Token env var:** `HF_TOKEN`

#### Why Hugging Face?
- Hosting ML models locally requires GPU/heavy RAM — not affordable on free tier
- HF Inference API lets you call state-of-the-art models over HTTP
- Free tier allows thousands of requests per day

#### Models used
| Model | HF ID | Output | Purpose |
|---|---|---|---|
| Sentence Transformer | `sentence-transformers/all-MiniLM-L6-v2` | 384-dim float vector | Semantic text similarity |
| CLIP (image) | `openai/clip-vit-base-patch32` | 512-dim float vector | Visual image similarity |

#### How it connects
```
FastAPI
  → huggingface_hub.InferenceClient(token=HF_TOKEN)
    → .feature_extraction(text,  model="sentence-transformers/all-MiniLM-L6-v2")
    → .feature_extraction(bytes, model="openai/clip-vit-base-patch32")
  ← numpy array → normalize → return to Node.js → store in Qdrant
```

#### How to get an HF token
1. huggingface.co → Settings → Access Tokens
2. Create token with **Read** scope
3. Paste as `HF_TOKEN` in Render FastAPI service environment

---

### 5. 🍃 MongoDB Atlas — Database

**URI:** `mongodb+srv://...@cluster.mongodb.net/campusLostFound`
**Used by:** Node.js backend on Render

#### Why MongoDB Atlas?
- Cloud-hosted — no server to manage
- Free M0 cluster is sufficient for campus scale
- Mongoose ODM integrates cleanly with Express.js

#### Collections
| Collection | Model | Purpose |
|---|---|---|
| `users` | `User.js` | Auth — name, email, bcrypt password hash, role |
| `lostitems` | `LostItem.js` | Lost item reports (title, desc, image, location, date) |
| `founditems` | `FoundItem.js` | Found item reports (title, desc, image, location, date) |
| `matches` | `Match.js` | AI matches linking lost + found item with score breakdown |
| `notifications` | `Notification.js` | In-app alerts when a match is created |
| `recoverysessions` | `RecoverySession.js` | Item handover sessions |
| `messages` | `Message.js` | Chat messages within recovery sessions |
| `aianalytics` | `AiAnalytics.js` | Embedding latencies and match counts per report |

#### How it was set up
1. mongodb.com/atlas → Create Free Cluster (M0)
2. Create DB user with strong password
3. Whitelist IP: `0.0.0.0/0` (required for Render's dynamic IPs)
4. Copy connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/campusLostFound?retryWrites=true&w=majority
   ```
5. Paste as `MONGO_URI` in Render backend environment

---

### 6. ☁️ Cloudinary — Image Storage & CDN

**Cloud Name:** `im1yxufu`
**Used by:** Node.js backend on Render

#### Why Cloudinary?
- Render's filesystem is **ephemeral** — uploaded files vanish on redeploy
- Cloudinary stores images permanently and delivers via global CDN
- `multer-storage-cloudinary` makes it a drop-in Multer storage adapter

#### Image flow
```
User uploads image (multipart form)
  → Multer middleware (backend)
    → multer-storage-cloudinary
      → Cloudinary CDN (stored permanently)
        ← Public URL returned (https://res.cloudinary.com/im1yxufu/...)
          → Saved in MongoDB (item.image field)
          → Passed to FastAPI /embed-image for CLIP embedding
```

#### How it was set up
1. cloudinary.com → Sign up → Dashboard
2. Note: Cloud Name, API Key, API Secret
3. Add to Render backend:
   ```
   CLOUDINARY_CLOUD_NAME = im1yxufu
   CLOUDINARY_API_KEY    = 234924619879931
   CLOUDINARY_API_SECRET = VyITuduo-xb0YGztz9q-_FwIs_E
   ```
4. Backend uses `multer-storage-cloudinary` — no further config needed

---

### 7. 🔵 Qdrant Cloud — Vector Database (AI Matching)

**URL:** `https://6a7c6202-59e4-42fe-a534-54a4a4fd48a3.sa-east-1-0.aws.cloud.qdrant.io`
**Used by:** Node.js backend on Render

#### Why Qdrant?
- MongoDB cannot do vector similarity search
- Qdrant is a purpose-built vector DB for cosine similarity search
- Powers the AI matching: find the Found item whose embedding is closest to a Lost item
- Free tier provides 1GB — enough for thousands of item embeddings

#### Qdrant Collections
| Collection | Dimensions | Source Model | Purpose |
|---|---|---|---|
| `text_embeddings` | 384 | `all-MiniLM-L6-v2` | Semantic text vectors (title + description) |
| `image_embeddings` | 512 | `clip-vit-base-patch32` | Visual image vectors |

Each Qdrant point payload:
```json
{
  "reportId":   "<MongoDB _id>",
  "reportType": "Lost" | "Found",
  "status":     "Active",
  "category":   "Electronics",
  "campusZone": "IT Block",
  "hasImage":   true,
  "isSensitive": false,
  "createdDate": "2026-07-12T..."
}
```

#### How it was set up
1. qdrant.tech/cloud → Create Free Cluster (AWS sa-east-1)
2. From cluster page, copy Cluster URL and API Key
3. Add to Render backend:
   ```
   QDRANT_URL     = https://6a7c6202-...qdrant.io
   QDRANT_API_KEY = eyJhbGci...
   ```
4. Collections auto-created on backend startup via `qdrantService.initCollections()`

#### ⚠️ Known Limitation — Payload Filtering Disabled
Qdrant Cloud free tier requires payload fields to be manually indexed before filters work.
Currently all filtering is done in JavaScript (`matchingService.js` — `passesFilters()` function)
after Qdrant returns the top-30 nearest vectors.

To enable native Qdrant filtering in the future:
```
PUT /collections/text_embeddings/index
{ "field_name": "reportType", "field_schema": "keyword" }
PUT /collections/text_embeddings/index
{ "field_name": "category", "field_schema": "keyword" }
PUT /collections/text_embeddings/index
{ "field_name": "status", "field_schema": "keyword" }
```

---

## 🔄 Complete Data Flow — When a User Submits a Found Item

```
1. User fills "Report Found Item" form on Vercel frontend
   └── title, description, category, location, date, image

2. Frontend POSTs to https://findit-backend-1pei.onrender.com/api/found-items
   └── Auth header: Bearer JWT token

3. Express → foundItemController.createFoundItem()
   ├── Multer middleware intercepts the image
   ├── multer-storage-cloudinary uploads to Cloudinary
   └── Returns Cloudinary URL → saved as FoundItem.image

4. FoundItem saved to MongoDB Atlas

5. aiOrchestrator.processAndMatchReport(item, 'found') [async]
   ├── embeddingPipeline.processReport(title, description, hasImage, imageUrl)
   │   ├── aiAdapter.processImageDocument(imageUrl)
   │   │   └── Fetch image → POST to FastAPI /process-document → OCR results
   │   ├── aiAdapter.generateImageEmbedding(imageUrl)
   │   │   └── Fetch image → POST FastAPI /embed-image
   │   │       └── FastAPI → HF InferenceClient → CLIP → 512-dim vector
   │   └── aiAdapter.generateTextEmbedding("Airpods white apple...")
   │       └── POST FastAPI /embed-text
   │           └── FastAPI → HF InferenceClient → MiniLM → 384-dim vector
   │
   ├── Save OCR results to MongoDB
   ├── Upsert text vector → Qdrant text_embeddings
   ├── Upsert image vector → Qdrant image_embeddings
   │
   └── matchingService.findMatches(item, 'found', textVec, imageVec, zone)
       ├── qdrantService.searchVectors('text_embeddings', textVec, top=30)
       │   └── Qdrant returns top-30 nearest vectors (mixed types)
       ├── passesFilters(): keep only {type=Lost, Active, same category, same zone}
       ├── MongoDB: LostItem.find({ _id: { $in: filteredIds } })
       └── For each candidate:
           ├── semantic, category, location, date scores computed
           ├── finalScore = sem×0.70 + cat×0.15 + loc×0.10 + date×0.05
           └── If finalScore ≥ 40:
               ├── Match.create({ lostItem, foundItem, score, breakdown })
               └── Notification.create() → Socket.io → real-time alert
```

---

## 🔌 Service Connection Map

```
VERCEL (Frontend)
  VITE_API_URL         ──────────► RENDER Backend
  VITE_BACKEND_URL     ──────────► RENDER Backend

RENDER (Backend Node.js)
  MONGO_URI            ──────────► MONGODB ATLAS
  QDRANT_URL           ──────────► QDRANT CLOUD
  QDRANT_API_KEY       ──────────► QDRANT CLOUD
  AI_SERVICE_URL       ──────────► RENDER FastAPI
  CLOUDINARY_*         ──────────► CLOUDINARY CDN
  CLIENT_URL           ──────────► VERCEL (CORS + Socket.io)
  JWT_SECRET           ──────────► (internal — token signing)

RENDER (FastAPI Python)
  HF_TOKEN             ──────────► HUGGING FACE API
```

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 18+, Python 3.10+, MongoDB (optional), Qdrant binary (optional)

### Step 1 — Start FastAPI AI Service
```bash
cd backend/ai_service
pip install -r requirements.txt
python app.py
# Running at http://localhost:8000
```

### Step 2 — Start Qdrant locally (Windows)
```powershell
cd backend
.\start-qdrant.ps1
# Running at http://localhost:6333
```

### Step 3 — Start Node.js Backend
```bash
cd backend
npm install
npm run dev
# Running at http://localhost:5000
```

### Step 4 — Start Frontend
```bash
cd frontend
npm install
npm run dev
# Running at http://localhost:5173
```

### Local `backend/.env` overrides
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/campusLostFound
JWT_SECRET=findit_campus_super_secret_jwt_key_2024
JWT_EXPIRE=7d
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
AI_SERVICE_URL=http://localhost:8000
CLOUDINARY_CLOUD_NAME=im1yxufu
CLOUDINARY_API_KEY=234924619879931
CLOUDINARY_API_SECRET=VyITuduo-xb0YGztz9q-_FwIs_E
CLIENT_URL=http://localhost:5173
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Local `frontend/.env` overrides
```env
VITE_API_URL=http://localhost:5000/api
VITE_BACKEND_URL=http://localhost:5000
```

---

## 📋 Deployed URLs Reference

| Service | Platform | URL |
|---|---|---|
| Frontend (React SPA) | Vercel | `https://your-app.vercel.app` |
| Backend API (Node.js) | Render | `https://findit-backend-1pei.onrender.com` |
| AI Service (FastAPI) | Render | `https://findit-ai-service.onrender.com` |
| Database | MongoDB Atlas | `cluster0.xxxxx.mongodb.net` |
| Image CDN | Cloudinary | `res.cloudinary.com/im1yxufu` |
| Vector DB | Qdrant Cloud | `6a7c6202-...sa-east-1-0.aws.cloud.qdrant.io` |
| ML Models | Hugging Face | `api-inference.huggingface.co` |

---

## 🔐 Security Notes

| Concern | How it is handled |
|---|---|
| Passwords | `bcryptjs` hashed before storage |
| Auth tokens | JWT signed with `JWT_SECRET`, 7-day expiry |
| API access | CORS restricted to `CLIENT_URL` only |
| WebSocket access | JWT verified on every Socket.io connection |
| Image secrets | `CLOUDINARY_API_SECRET` never exposed to frontend |
| ML token | `HF_TOKEN` only in FastAPI env — not in any client code |

---

## 🧠 AI Matching — Scoring Formula

**Without image:**
```
finalScore = (semanticSimilarity × 0.70)
           + (categoryMatch      × 0.15)
           + (locationMatch      × 0.10)
           + (dateMatch          × 0.05)
```

**With image (both items have images):**
```
finalScore = (clipSimilarity     × 0.45)
           + (semanticSimilarity × 0.35)
           + (categoryMatch      × 0.10)
           + (locationMatch      × 0.05)
           + (dateMatch          × 0.05)
```

**Match threshold:** `finalScore >= 40` → Match created + Notifications sent
**Confidence levels:**
- Very High → score >= 95
- High      → score >= 90
- Medium    → score >= 80
- Low       → score < 80
