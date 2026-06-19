# Argus Vision Studio

Computer vision web application with face recognition, object detection, Haar cascade detection, image segmentation, pose estimation, and captioning/VQA.

## Features

- **Face Recognition** — Register people by photo, recognize them live via webcam or uploaded image. 512-D InsightFace embeddings stored in Qdrant; gallery persists across sessions.
- **Object Detection** — YOLO-based detection with 80 COCO classes
- **Image Segmentation** — YOLO segmentation with mask overlays
- **Haar Cascade Detector** — 12 configurable OpenCV classifiers (face, eye, smile, body, cat face...)
- **Pose Estimation** — Human keypoint detection with skeleton overlays
- **Captioning & VQA** — Local Ollama vision models for image descriptions and visual questions

## Setup

```bash
pip install -r requirements.txt
```

## Run

```bash
python main.py
```

Open http://localhost:8000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/face/persons` | List all registered persons |
| `POST` | `/face/register` | Register a new face (`name` query param, `image` file) |
| `POST` | `/face/recognize` | Recognize a face (`threshold` query param, `image` file) |
| `DELETE` | `/face/{person_id}` | Delete a person from Qdrant and SQLite |
| `POST` | `/detection/detect` | YOLO object detection (`image` file) |
| `POST` | `/segment/segment` | YOLO image segmentation (`image` file) |
| `POST` | `/haardcascade/detect` | Haar cascade detection (`image` file) |
| `GET` | `/caption/vision-models` | List Ollama vision-capable models |
| `POST` | `/caption/caption` | Caption an image via Ollama (`model`, `prompt` query params, `image` file) |

Interactive API docs: http://localhost:8000/docs

## Architecture

```
main.py                   # FastAPI app — CORS, static files, router mounts, init_db
frontend/                 # CDN-based React (no build step)
  api.js                  # window.API — wrappers for all backend endpoints
  app.jsx                 # router shell, webcam hook, layout
  pages.jsx               # Face Recognition, Object Detection, Dashboard
  pages2.jsx              # Haar Cascade Detector, Segmentation, Pose Estimation
  pages3.jsx              # Captioning
  primitives.jsx          # Shared UI components
  data.js                 # Static constants (COCO classes, etc.)
routers/
  face.py                 # GET /face/persons, POST /face/register, POST /face/recognize, DELETE /face/{id}
  detection.py            # POST /detection/detect
  segment.py              # POST /segment/segment
  haardcascade.py         # POST /haardcascade/detect
  caption.py              # GET /caption/vision-models, POST /caption/caption (proxies to Ollama)
src/                      # ML engine implementations
  face_recognition.py     # InsightFace buffalo_l (512-D embeddings, SCRFD detector)
  object_detection.py     # YOLOv8 detection
  image_segmentation.py   # YOLOv8 segmentation
  haarcascade_detection.py
database/
  face_sqlite.py          # SQLite — persons + recognition_logs tables
  face_vector.py          # Qdrant local — 512-D cosine collection
haard/                    # Haar cascade CLI (standalone, not part of web app)
  haar_app.py             # Interactive webcam detection menu
  download_cascades.py    # Downloads OpenCV cascade XML files
data/
  faces.db                # SQLite database (created on first run)
  qdrant/                 # Qdrant vector store (created on first run)
  haarcascades/           # OpenCV cascade XML files
models/
  yolo26n.pt / .mlpackage       # Detection weights
  yolo26n-seg.pt / .mlpackage   # Segmentation weights
```

## Models

| Model | Task | Backend |
|-------|------|---------|
| InsightFace buffalo_l | Face embedding + detection | CoreML (macOS) / CPU |
| YOLOv8n | Object detection | CoreML (macOS) / CPU |
| YOLOv8n-seg | Segmentation | CoreML (macOS) / CPU |
| OpenCV Haar cascades | Classic face/body detection | CPU |
| Ollama vision models | Captioning / VQA | Local Ollama (`localhost:11434`) |

InsightFace buffalo_l is downloaded automatically to `~/.insightface/` on first use.

Captioning requires [Ollama](https://ollama.com) running locally with at least one vision model pulled (e.g. `ollama pull llava`).

## Platform Notes

- **macOS**: CoreML acceleration via `CoreMLExecutionProvider`; webcam via `CAP_AVFOUNDATION`
- **Other platforms**: Falls back to `CPUExecutionProvider`
- Start the server from the project root — database paths (`./data/`) are relative to CWD
