# 🏆 NETRA ANPR — SIH Finale-Winning Roadmap

> **Problem Statement**: PS 26127 — City-Wide AI Engine for Multi-Camera ANPR, Trajectory Tracking & Urban Traffic Analytics

---

## Your Current State

| Item | Status |
|---|---|
| Repo & `.gitignore` | ✅ Done |
| Folder structure (backend, frontend, AI, configs, data, docs, scripts, tests) | ✅ Created |
| Backend virtualenv | ✅ `.venv` exists |
| FastAPI app factory (`app/main.py`) | ✅ Done — CORS, routers, WS, lifespan |
| DB Models (Camera, Detection, Trajectory, Blacklist, Alert) | ✅ Done — SQLAlchemy + PostGIS |
| Pydantic Schemas (all 5) | ✅ Done |
| API Routes (15 endpoints across 5 routers) | ✅ Done |
| WebSocket Manager (`/ws/alerts`, `/ws/live-feed`) | ✅ Done |
| Services (DetectionService, TrajectoryService, AlertService) | ✅ Done |
| Alembic migrations setup | ✅ Done — async env.py configured |
| `.env` config file | ✅ Done |
| Database (PostgreSQL + PostGIS) | ⚠️ Needs local install + `CREATE EXTENSION postgis;` |
| AI pipeline (YOLO + OCR) | ❌ Stage 3 |
| Frontend (React + Leaflet GIS) | ❌ Stage 5 |
| Docker setup | ❌ Stage 7 |


**You are at the very beginning of Stage 2.** The roadmap below picks up from where you are.

---

## 7-Stage Execution Roadmap

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### STAGE 1 ✅ — Environment & Version Control (DONE)
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- [x] GitHub repo initialized
- [x] `.gitignore` for Python, Redis, venvs
- [x] Folder structure created
- [x] Backend virtualenv created

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### STAGE 2 ✅ — Backend Skeleton + Database Schema (DONE)
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Goal**: A fully structured FastAPI backend connected to PostgreSQL+PostGIS with all core tables.

#### Step 2.1 — Install core backend dependencies
```bash
pip install fastapi uvicorn sqlalchemy asyncpg alembic geoalchemy2 python-dotenv pydantic[email] redis python-multipart websockets
```

#### Step 2.2 — Restructure backend into proper package layout
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app creation, CORS, startup/shutdown
│   ├── config.py             # Settings from .env (DB URL, Redis, secrets)
│   ├── database.py           # SQLAlchemy async engine + session
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes_detection.py    # POST /api/v1/detection/process-frame
│   │   ├── routes_vehicles.py     # GET /api/v1/vehicles/search, /{plate}/trajectory
│   │   ├── routes_analytics.py    # GET /api/v1/analytics/density, /heatmaps
│   │   ├── routes_alerts.py       # POST /api/v1/alerts/blacklist, GET alerts
│   │   └── routes_cameras.py      # CRUD for camera management
│   ├── models/
│   │   ├── __init__.py
│   │   ├── camera.py          # cameras table (PostGIS Point)
│   │   ├── detection.py       # detections table
│   │   ├── trajectory.py      # trajectories table (PostGIS LineString)
│   │   ├── blacklist.py       # blacklisted plates
│   │   └── alert.py           # alerts table
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── camera.py          # Pydantic request/response models
│   │   ├── detection.py
│   │   ├── vehicle.py
│   │   └── alert.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── detection_service.py   # AI pipeline orchestrator
│   │   ├── trajectory_service.py  # Spatial trajectory builder
│   │   └── alert_service.py       # Alert matching & dispatch
│   └── ws/
│       ├── __init__.py
│       └── websocket_manager.py   # WebSocket connection manager
├── alembic/                   # DB migrations
├── requirements.txt
├── .env                       # DB_URL, REDIS_URL, SECRET_KEY
└── main.py                    # Entry point: `uvicorn app.main:app`
```

#### Step 2.3 — Set up PostgreSQL + PostGIS
- Install PostgreSQL locally (or use Docker)
- Enable PostGIS extension: `CREATE EXTENSION postgis;`
- Create `.env` file with `DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/netra_db`

#### Step 2.4 — Define database models (SQLAlchemy + GeoAlchemy2)

**Core tables**:

| Table | Key Columns |
|---|---|
| `cameras` | `id`, `name`, `location_name`, `coordinates` (Point SRID 4326), `status`, `stream_url` |
| `detections` | `id`, `camera_id` (FK), `timestamp`, `plate_number`, `confidence`, `vehicle_type`, `vehicle_color`, `bbox_json`, `reid_embedding` (bytea) |
| `trajectories` | `id`, `plate_number`, `start_time`, `end_time`, `path` (LineString SRID 4326), `total_distance_km` |
| `blacklist` | `id`, `plate_number`, `reason`, `severity`, `created_at` |
| `alerts` | `id`, `alert_type`, `plate_number`, `camera_id` (FK), `timestamp`, `details` (JSONB), `is_acknowledged` |

#### Step 2.5 — Create all 6 REST API route files (stubs first, logic later)

**Endpoints to wire up**:
- `POST /api/v1/detection/process-frame`
- `GET /api/v1/vehicles/search?plate=&color=&start_date=&end_date=`
- `GET /api/v1/vehicles/{plate}/trajectory`
- `GET /api/v1/analytics/density`
- `GET /api/v1/analytics/heatmaps`
- `POST /api/v1/alerts/blacklist`
- `GET /api/v1/alerts`
- `CRUD /api/v1/cameras`
- `WS /ws/alerts`
- `WS /ws/live-feed`

#### Step 2.6 — Verify
- Run `uvicorn app.main:app --reload`
- Open `http://localhost:8000/docs` → Swagger UI should show all endpoints
- Test health/root endpoints

> [!IMPORTANT]
> **Milestone**: Backend starts, Swagger shows all routes, DB tables created via Alembic migration.

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### STAGE 3 — AI Inference Pipeline (YOLO + OCR + Local Tracking) (👈 YOU ARE HERE)
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Goal**: Process a video/image → detect vehicles → crop plates → read plate text → store detection.

#### Step 3.1 — Set up AI module
```
AI/
├── detection/
│   ├── yolo_detector.py       # YOLOv8 vehicle + plate detection
│   └── weights/               # .pt model files (gitignored)
├── ocr/
│   ├── plate_reader.py        # PaddleOCR / EasyOCR wrapper
│   └── preprocessing.py       # Grayscale, contrast enhancement, denoising
├── tracking/
│   ├── deep_sort_tracker.py   # DeepSORT/ByteTrack local MOT
│   └── reid_extractor.py      # Vehicle Re-ID embedding extraction
├── pipeline.py                # Full pipeline: frame → detections list
└── requirements_ai.txt        # ultralytics, paddleocr, opencv-python, etc.
```

#### Step 3.2 — Implement detection pipeline
```python
# Simplified pipeline flow:
frame → YOLOv8(frame) → [vehicle_bboxes, plate_bboxes]
    → crop plate regions
    → preprocess (grayscale, CLAHE, denoise)
    → PaddleOCR(plate_crop) → plate_text + confidence
    → store Detection(camera_id, plate_text, confidence, vehicle_type, timestamp)
```

#### Step 3.3 — Test with sample data
- Put sample images/videos in `data/sample_videos/` and `data/test_images/`
- Run pipeline on test data, verify plate text extraction accuracy

> [!TIP]
> **Team Members 1 & 2** can train/fine-tune YOLO on Indian plate datasets in **Google Colab**, then export weights for you to integrate locally.

> [!IMPORTANT]
> **Milestone**: Feed a video → get back a list of `{plate_number, confidence, vehicle_type, timestamp}` detections stored in DB.

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### STAGE 4 — Trajectory Engine & PostGIS Spatial Matching
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Goal**: Track a single vehicle across multiple cameras over time, generating a GeoJSON path.

#### Step 4.1 — Cross-camera matching logic
```
For each new detection:
  1. Query recent detections with same plate_number
  2. Verify spatial-temporal feasibility (speed between cameras < 200 km/h)
  3. If match → append to existing trajectory
  4. If no match → create new trajectory
  5. Optional: use Re-ID embedding similarity when plate confidence is low
```

#### Step 4.2 — PostGIS trajectory queries
```sql
-- Build trajectory LineString from detection points
SELECT ST_MakeLine(c.coordinates ORDER BY d.timestamp) AS path
FROM detections d
JOIN cameras c ON d.camera_id = c.id
WHERE d.plate_number = 'MH12AB1234';

-- Calculate distance
SELECT ST_Length(path::geography) / 1000 AS distance_km FROM trajectories WHERE plate_number = 'MH12AB1234';
```

#### Step 4.3 — Wire trajectory API
- `GET /api/v1/vehicles/{plate}/trajectory` → returns GeoJSON `FeatureCollection`

> [!IMPORTANT]
> **Milestone**: Query any plate number → get a GeoJSON trajectory path with timestamps at each camera point.

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### STAGE 5 — Command Center GIS Dashboard (React + Leaflet + WebSockets)
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Goal**: Interactive web dashboard with live map, trajectory visualization, and real-time alerts.

#### Step 5.1 — Set up React/Next.js frontend
```
frontend/
├── src/
│   ├── components/
│   │   ├── Map/
│   │   │   ├── CameraMarkers.jsx      # Camera pin icons on map
│   │   │   ├── TrajectoryLayer.jsx     # Animated polyline paths
│   │   │   └── HeatmapLayer.jsx        # Traffic density heatmap
│   │   ├── Dashboard/
│   │   │   ├── StatsCards.jsx          # Total vehicles, active alerts, cameras
│   │   │   ├── AlertFeed.jsx           # Real-time scrolling alert list
│   │   │   └── VehicleSearch.jsx       # Search bar + results table
│   │   └── Charts/
│   │       ├── TrafficFlowChart.jsx    # Hourly traffic volume
│   │       └── DetectionAccuracyChart.jsx
│   ├── hooks/
│   │   └── useWebSocket.js            # WebSocket connection hook
│   ├── services/
│   │   └── api.js                     # Axios/fetch API client
│   └── App.jsx
├── public/
└── package.json
```

#### Step 5.2 — Core dashboard pages
1. **Live Map View** — Full-screen Leaflet map, camera pins, animated trajectory replay
2. **Vehicle Search** — Search by plate, show history + trajectory on map
3. **Alert Feed** — Real-time WebSocket alerts with severity badges
4. **Analytics** — Charts for traffic density, peak hours, detection accuracy

#### Step 5.3 — WebSocket integration
```javascript
// useWebSocket.js
const ws = new WebSocket('ws://localhost:8000/ws/alerts');
ws.onmessage = (event) => {
  const alert = JSON.parse(event.data);
  // Show toast notification + add to alert feed
};
```

> [!IMPORTANT]
> **Milestone**: Open dashboard → see map with camera pins → search a plate → animated trajectory draws on map → alerts pop up in real-time.

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### STAGE 6 — Advanced Analytics & Intelligence
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Goal**: Add the "wow factor" features that win SIH.

#### 6.1 — Traffic density heatmaps
- Aggregate detections per camera per hour
- Return heatmap data → render with Leaflet.heat

#### 6.2 — Vehicle Re-ID fusion
- When OCR confidence < threshold, use visual Re-ID embeddings (cosine similarity)
- Cross-camera identity fusion = OCR match + Re-ID match + speed-feasibility check

#### 6.3 — Route anomaly detection
- Define normal corridors per plate (historical data)
- Flag unexpected camera appearances (stolen vehicle detection)

#### 6.4 — Origin-Destination matrix
- Track where vehicles enter and exit the camera network
- Visualize as chord diagram or flow arrows on map

> [!IMPORTANT]
> **Milestone**: Heatmaps render on map, Re-ID fusion improves accuracy, anomaly alerts trigger automatically.

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### STAGE 7 — SIH Finale Polish & Presentation
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Goal**: Bulletproof live demo + compelling pitch.

#### 7.1 — Docker Compose setup
```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [db, redis]
  db:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: netra_db
      POSTGRES_PASSWORD: netra_secret
  redis:
    image: redis:7-alpine
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
```

#### 7.2 — Seed demo data
- Pre-load 5-10 camera locations (real city coordinates)
- Pre-load 50+ detection records with trajectories
- Pre-load 3-5 blacklisted plates

#### 7.3 — Live demo script
1. Open dashboard → show map with cameras
2. "Process" a video feed → detections appear in real-time
3. Search a plate → animated trajectory draws on map
4. Blacklisted vehicle detected → alert pops up with sound
5. Show density heatmap → zoom into congested area
6. Show architecture slide → explain scaling strategy (TensorRT, Triton, Kafka)

#### 7.4 — Pitch deck highlights
- **Innovation**: Cross-camera trajectory tracking (not just ANPR)
- **Scalability**: PostGIS spatial indexing, Redis caching, modular microservices
- **Real-world impact**: Law enforcement, traffic management, urban planning
- **Tech depth**: Explain Re-ID fusion, spatiotemporal constraints, GeoJSON trajectories

---

## Team Task Assignment Matrix

| Person | Role | Stage 2 | Stage 3 | Stage 4 | Stage 5 | Stage 6-7 |
|---|---|---|---|---|---|---|
| **You (Lead)** | Integration & Architecture | Backend structure, DB setup | Connect AI → Backend | Trajectory service | Wire frontend ↔ backend | Docker, demo, pitch |
| **P1 & P2** | AI/CV | — | YOLO training, OCR fine-tuning (Colab) | Re-ID model training | — | Model optimization |
| **P3** | Tracking & Re-ID | — | DeepSORT integration | Cross-camera matching algo | — | Anomaly detection |
| **P4** | Frontend & GIS | — | — | — | React dashboard, Leaflet map | UI polish, animations |
| **P5** | Backend & DB | DB models, Alembic | API route implementations | Spatial queries | WebSocket handlers | Seed data, testing |

---

## Open Questions

> [!IMPORTANT]
> **Decisions needed before proceeding:**

1. **PostgreSQL setup**: Do you want to run PostgreSQL locally, or use Docker for the database? Docker is simpler and more portable.
2. **Frontend framework**: The chat discussed React/Next.js. Do you want **Next.js** (SSR, routing built-in) or **plain Vite + React** (lighter, faster dev)?
3. **OCR library**: **PaddleOCR** (more accurate for Indian plates, heavier) vs **EasyOCR** (easier setup, slightly less accurate)?
4. **Do you want me to start building Stage 2 now?** I can scaffold the entire backend package structure, DB models, and API routes for you right away.

---

## Verification Plan

### After Each Stage:
- **Stage 2**: `uvicorn` starts, Swagger UI shows all endpoints, DB tables exist
- **Stage 3**: Process test image → plate text extracted with >80% accuracy
- **Stage 4**: Query plate → GeoJSON trajectory returned
- **Stage 5**: Dashboard loads, map renders, search works, alerts stream
- **Stage 6**: Heatmap renders, Re-ID improves accuracy
- **Stage 7**: Full end-to-end demo runs without errors in Docker
