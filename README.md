# LOCO — Location Assessment Tool

A complete, production-grade location evaluation platform designed to answer the operational business decision: **"Is this location worth pursuing?"**

Given any US location (street address, city/state, or geographic coordinates), LOCO automatically converts the address to coordinates via the US Census Geocoder, concurrently fetches real-time public facts from USGS and Open-Meteo, calculates an objective 0–100 viability score using deterministic, transparent rules, persists the assessment in Supabase PostgreSQL, and presents an interactive operational breakdown.

---

## ⚡ Tech Stack

- **Backend:** Python 3.10+, FastAPI, Uvicorn, Pydantic v2, HTTPX (async client), Pytest
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Database:** Supabase PostgreSQL (with automatic local SQLite fallback for offline development)
- **Deployment:** Vercel (Frontend), Supabase (Database), Zoho Catalyst AppSail / Render (Backend)

---

## 🏗️ Architecture & Data Flow

```
                     ┌────────────────────────────────────────┐
                     │   React + TypeScript Frontend (Vite)   │
                     │         https://loco-lake.vercel.app   │
                     └───────────────────┬────────────────────┘
                                         │ REST API
                                         ▼
                     ┌────────────────────────────────────────┐
                     │          FastAPI Backend Server        │
                     └───────┬───────────┬────────────┬───────┘
                             │           │            │
            ┌────────────────┘           │            └────────────────┐
            ▼                            ▼                             ▼
  US Census Geocoder              USGS Elevation              Open-Meteo Weather
(Address ➔ Lat/Lng)             (Elevation in Feet)         (Temperature & Condition)
            │                            │                             │
            └────────────────┬───────────┴────────────┬────────────────┘
                             ▼                        ▼
                      ┌──────────────────────────────────────┐
                      │    Deterministic Scoring Engine      │
                      │       (backend/scoring/rules.py)     │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │   Supabase PostgreSQL / SQLite DB    │
                      └──────────────────────────────────────┘
```

---

## 🔌 Public Data Integrations

| Data Source | Purpose | Endpoint / Specification | Timeout & Headers |
| :--- | :--- | :--- | :--- |
| **US Census Geocoder** | Resolves US addresses into coordinates | `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress` | 10.0s timeout, custom User-Agent |
| **USGS Elevation Service** | Resolves geographic altitude in feet | `https://epqs.nationalmap.gov/v1/json` | 10.0s timeout, custom User-Agent |
| **Open-Meteo Weather** | Real-time temperature (°F) & WMO code | `https://api.open-meteo.com/v1/forecast` | 10.0s timeout, custom User-Agent |

- **Concurrent Async Execution:** All external API queries are executed concurrently via `asyncio.gather`.
- **Custom User-Agent:** All HTTP requests include a descriptive identification header `LocationAssessmentTool/1.0`.

---

## 📊 Scoring Rules & Weighting

Total Maximum Score: **100 Points**

All scoring calculations are transparent, deterministic, and located exclusively in [`backend/scoring/rules.py`](backend/scoring/rules.py).

### 1. Elevation Factor (Maximum: 30.0 Points)
*Source: USGS Elevation Point Query Service*
- **0 ft – 4,000 ft**: `30.0 pts` (Optimal human, logistics, and commercial altitude)
- **4,001 ft – 7,000 ft**: `25.0 pts` (High altitude e.g. Denver, CO at 5,280 ft)
- **7,001 ft – 10,000 ft**: `15.0 pts` (Very high altitude; colder, operational overhead)
- **> 10,000 ft or < 0 ft**: `5.0 pts` (Extreme altitude or below sea level)

### 2. Temperature Factor (Maximum: 30.0 Points)
*Source: Open-Meteo Weather API*
- **60.0°F – 80.0°F**: `30.0 pts` (Optimal comfort range)
- **45.0°F – 59.9°F** or **80.1°F – 92.0°F**: `22.0 pts` (Moderate temperature)
- **30.0°F – 44.9°F** or **92.1°F – 104.0°F**: `12.0 pts` (Cold or hot conditions)
- **< 30.0°F** or **> 104.0°F**: `5.0 pts` (Extreme freeze or extreme heat)

### 3. Weather Condition Factor (Maximum: 40.0 Points)
*Source: Open-Meteo WMO Weather Interpretation Codes*
- **Clear sky / Mainly clear** (Codes 0, 1): `40.0 pts`
- **Partly cloudy / Overcast** (Codes 2, 3): `32.0 pts`
- **Fog / Drizzle / Rime fog** (Codes 45, 48, 51–57): `20.0 pts`
- **Rain / Snow / Showers** (Codes 61–86): `10.0 pts`
- **Thunderstorm / Severe Weather / Hail** (Codes 95–99): `0.0 pts`

---

## ⚠️ Unavailable Data Handling

If any external API is down, returns an error, or times out:
1. **Never Crash:** The application gracefully isolates the failure and continues scoring the other factors.
2. **Never Treat as Zero:** Missing data is never recorded as 0 points. It is recorded with `points = NULL`, `raw_value = NULL`, `status = "unavailable"`, and an explanatory `reason`.
3. **Proportional Re-scaling:** The final 0–100 score is dynamically re-scaled across the available factors:
   $$\text{Total Score} = \text{round}\left( \frac{\sum \text{Earned Points from Available Factors}}{\sum \text{Max Points of Available Factors}} \times 100 \right)$$
4. **All Factors Unavailable:** If all data sources fail, `total_score` is saved as `NULL` (`None`) and flagged to operations as incomplete.

---

## 🔐 Environment Variables

### Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```env
# Supabase PostgreSQL Configuration (Optional: falls back to local SQLite if omitted)
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# CORS Allowed Origins (comma-separated list of allowed frontend URLs)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://loco-lake.vercel.app

# External API Request Timeout in seconds
HTTP_TIMEOUT=10.0

# HTTP User-Agent Header for public API requests
USER_AGENT=LocationAssessmentTool/1.0 (production@loco.internal)
```

### Frontend Configuration (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```env
# Local development:
VITE_API_BASE_URL=http://localhost:8000/api

# Production deployment:
# VITE_API_BASE_URL=https://your-backend-api-domain.com/api
```

---

## 🚀 Local Development Setup

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn main:app --reload --port 8000
```

- API Base URL: `http://localhost:8000`
- Interactive Swagger Documentation: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/health`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

- Frontend URL: `http://localhost:3000` (or `http://localhost:5173`)

---

## 🗄️ Database Setup (Supabase PostgreSQL)

LOCO works out of the box with SQLite for local development, or with Supabase PostgreSQL for cloud production.

To use Supabase:
1. Create a new project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Run the schema located in [`backend/schema.sql`](backend/schema.sql):

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label VARCHAR(255) NOT NULL,
    address TEXT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    total_score DOUBLE PRECISION NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    factor_name VARCHAR(255) NOT NULL,
    raw_value TEXT NULL,
    points DOUBLE PRECISION NULL,
    max_points DOUBLE PRECISION NOT NULL,
    source VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    reason TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessment_factors_assessment_id 
ON assessment_factors(assessment_id);
```

4. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `backend/.env`.

---

## 📡 API Reference

### 1. Assess Location
- **Endpoint:** `POST /api/assessments`
- **Payload (Address):**
  ```json
  {
    "label": "Austin Operations Center",
    "address": "1100 Congress Ave, Austin, TX 78701"
  }
  ```
- **Payload (Coordinates):**
  ```json
  {
    "label": "Denver Hub",
    "latitude": 39.7392,
    "longitude": -104.9903
  }
  ```
- **Response:** `201 Created` with full assessment and factor breakdown.

### 2. List Assessments
- **Endpoint:** `GET /api/assessments`
- **Response:** Array of all saved assessments sorted by creation date descending.

### 3. Get Assessment Details
- **Endpoint:** `GET /api/assessments/{id}`
- **Response:** Single assessment with complete factor status, raw values, and points.

### 4. Health Check
- **Endpoint:** `GET /health`
- **Response:** `{"status": "ok", "app": "LOCO Location Assessment API"}`

---

## 🧪 Testing

Run unit tests using Pytest:

```bash
cd backend
pytest -v
```

**Unit Test Coverage:**
- Normal factor score calculation across ideal ranges
- Boundary values and high/low extremes
- **Unavailable data handling:** Verifies points remain `None`, never converted to zero
- Proportional re-scaling logic when 1 or 2 factors fail
- All factors unavailable (`total_score = None`)
- Score bounds verification ($0 \le \text{score} \le 100$)

---

## 🌐 Production Deployment

- **Frontend:** Hosted on [Vercel](https://vercel.com) at [https://loco-lake.vercel.app](https://loco-lake.vercel.app)
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Environment Variable: `VITE_API_BASE_URL`
- **Database:** Hosted on [Supabase](https://supabase.com) PostgreSQL
- **Backend:** Can be hosted on any container PaaS (Render, Railway, Fly.io, Zoho Catalyst AppSail)
  - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
  - Environment Variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS`

---

## 📄 License

MIT License.
