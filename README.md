# LOCO — Location Assessment Tool

> **The repository includes the source code, setup instructions, implementation details, and tests.**

LOCO is a complete, production-grade location evaluation platform built to automate the core business question: **"Is this location worth pursuing?"**

Given any US location (street address, city/state, or geographic coordinates), LOCO automatically converts the address to coordinates via the US Census Geocoder, concurrently queries real-time public facts from USGS and Open-Meteo, calculates an objective 0–100 viability score using deterministic, transparent rules, persists the assessment in Supabase PostgreSQL, and presents an interactive operational breakdown.

---

## 📑 Table of Contents

1. [📂 Source Code Structure](#1--source-code-structure)
2. [⚙️ Setup Instructions](#2-️-setup-instructions)
   - [Prerequisites](#prerequisites)
   - [Backend Setup (FastAPI)](#backend-setup-fastapi)
   - [Frontend Setup (React + Vite)](#frontend-setup-react--vite)
   - [Environment Variables](#environment-variables)
   - [Database Setup (Supabase PostgreSQL & SQLite Fallback)](#database-setup-supabase-postgresql--sqlite-fallback)
   - [Production Deployment](#production-deployment)
3. [🧠 Implementation Details](#3--implementation-details)
   - [The Business Problem](#the-business-problem)
   - [System Architecture & Data Flow](#system-architecture--data-flow)
   - [Public Data Integrations](#public-data-integrations)
   - [Scoring Rules & Weighting](#scoring-rules--weighting)
   - [Unavailable Data Handling](#unavailable-data-handling)
   - [REST API Specifications](#rest-api-specifications)
4. [🧪 Tests](#4--tests)
   - [Running the Test Suite](#running-the-test-suite)
   - [Test Scenarios Covered](#test-scenarios-covered)

---

## 1. 📂 Source Code Structure

The repository is organized into a clean, decoupled full-stack architecture:

```
LOCO/
├── backend/
│   ├── routes/
│   │   ├── __init__.py
│   │   └── assessments.py       # REST API endpoints (POST, GET assessments)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── census.py            # US Census Geocoder API client
│   │   ├── elevation.py         # USGS Elevation Point Query Service client
│   │   └── weather.py           # Open-Meteo weather and temperature client
│   ├── scoring/
│   │   ├── __init__.py
│   │   └── rules.py             # Deterministic scoring engine & re-scaling logic
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_scoring.py      # Pytest unit tests for all scoring rules & edge cases
│   ├── config.py                # Environment configuration & settings
│   ├── database.py              # Supabase PostgreSQL client with SQLite fallback
│   ├── schemas.py               # Pydantic request & response models
│   ├── schema.sql               # PostgreSQL DDL table definitions
│   ├── main.py                  # FastAPI application entrypoint & CORS middleware
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts        # Typed HTTP client for backend REST API
│   │   ├── components/          # Reusable UI components (ScoreCard, FactorCard, etc.)
│   │   ├── pages/
│   │   │   ├── NewAssessment.tsx    # Location submission form & live evaluation
│   │   │   ├── AssessmentsList.tsx  # Historical assessments table & stats
│   │   │   └── AssessmentDetail.tsx # Deep-dive factor breakdown view
│   │   ├── types/               # TypeScript interfaces matching backend models
│   │   ├── App.tsx              # Application layout & navigation
│   │   └── index.css            # Tailored design system & CSS styling
│   ├── package.json             # Frontend dependencies & scripts
│   ├── vite.config.ts           # Vite bundler configuration
│   └── .env.example             # Frontend environment template
├── .gitignore                   # Git exclusion rules
└── README.md                    # Project documentation
```

---

## 2. ⚙️ Setup Instructions

### Prerequisites
- **Python 3.10+** (Python 3.11 or 3.12 recommended)
- **Node.js 18+** & **npm**

---

### Backend Setup (FastAPI)

1. Open your terminal and navigate to the `backend/` folder:
   ```bash
   cd backend
   ```

2. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (CMD):**
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **macOS / Linux:**
     ```bash
     source venv/bin/activate
     ```

4. Install the required backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Launch the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

- **API Base URL:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **Health Check Endpoint:** `http://localhost:8000/health`

---

### Frontend Setup (React + Vite)

1. Open a new terminal tab and navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the local Vite development server:
   ```bash
   npm run dev
   ```

- **Frontend Application URL:** `http://localhost:3000` (or `http://localhost:5173`)

---

### Environment Variables

#### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `SUPABASE_URL` | Supabase project URL (optional, falls back to SQLite) | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role secret | `eyJhbGciOi...` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:3000,http://localhost:5173,https://loco-lake.vercel.app` |
| `HTTP_TIMEOUT` | External API request timeout (seconds) | `10.0` |
| `USER_AGENT` | HTTP User-Agent identifier | `LocationAssessmentTool/1.0 (production@loco.internal)` |

#### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:
```bash
cp frontend/.env.example frontend/.env
```

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api` |

---

### Database Setup (Supabase PostgreSQL & SQLite Fallback)

LOCO includes a dual-engine database strategy:
- **Cloud Production:** Supabase PostgreSQL
- **Zero-Config Local:** If no Supabase credentials are provided, LOCO automatically boots and initializes a local SQLite database (`loco_assessments.db`).

To configure Supabase PostgreSQL:
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard and run [`backend/schema.sql`](backend/schema.sql):

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

3. Paste your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`.

---

### Production Deployment

- **Frontend (Vercel):**
  - Hosted at: [https://loco-lake.vercel.app](https://loco-lake.vercel.app)
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment variable: `VITE_API_BASE_URL`
- **Database (Supabase):** Managed PostgreSQL instance with automated backups and indexation.
- **Backend (PaaS):** Deployable to Render, Railway, Fly.io, or Zoho Catalyst AppSail using `uvicorn main:app --host 0.0.0.0 --port $PORT`.

---

## 3. 🧠 Implementation Details

### The Business Problem
An operations team needs a fast, objective answer to: **"Is this location worth pursuing?"**
Manual location evaluation is slow, subjective, and prone to inconsistent criteria. LOCO solves this by:
1. Accepting either human-entered US addresses or raw GPS coordinates.
2. Enriching the location with verified public datasets (altitude, temperature, weather severity).
3. Applying an explicit, auditable scoring rubric that produces a 0–100 score.
4. Preserving the exact factor-by-factor breakdown so operations can see *why* a location received its score.

---

### System Architecture & Data Flow

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

### Public Data Integrations

| Data Source | Purpose | Endpoint | Resilience |
| :--- | :--- | :--- | :--- |
| **US Census Geocoder** | Geocodes US street addresses into coordinates | `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress` | 10.0s timeout, custom User-Agent |
| **USGS Elevation Service** | Measures ground elevation in feet | `https://epqs.nationalmap.gov/v1/json` | 10.0s timeout, custom User-Agent |
| **Open-Meteo Weather** | Current temperature (°F) and WMO weather condition | `https://api.open-meteo.com/v1/forecast` | 10.0s timeout, custom User-Agent |

- **Concurrent Async Gathering:** Factor requests run simultaneously via `asyncio.gather`, minimizing overall response latency.
- **Fail-Safe Client:** Network timeouts, 4xx/5xx status codes, and unparseable responses are safely caught and transformed into structured unavailable factor records without raising unhandled exceptions.

---

### Scoring Rules & Weighting

Total Maximum Score: **100 Points**

All scoring calculations are encapsulated in [`backend/scoring/rules.py`](backend/scoring/rules.py):

#### 1. Elevation Factor (Max: 30.0 Points) — USGS
- **0 ft – 4,000 ft**: `30.0 pts` (Optimal human, logistics, and supply-chain altitude)
- **4,001 ft – 7,000 ft**: `25.0 pts` (High altitude; e.g., Denver, CO at 5,280 ft)
- **7,001 ft – 10,000 ft**: `15.0 pts` (Very high altitude; increased operating costs)
- **> 10,000 ft or < 0 ft**: `5.0 pts` (Extreme altitude or below sea level)

#### 2. Temperature Factor (Max: 30.0 Points) — Open-Meteo
- **60.0°F – 80.0°F**: `30.0 pts` (Ideal temperate comfort zone)
- **45.0°F – 59.9°F** or **80.1°F – 92.0°F**: `22.0 pts` (Moderate temperature)
- **30.0°F – 44.9°F** or **92.1°F – 104.0°F**: `12.0 pts` (Cold or hot climate)
- **< 30.0°F** or **> 104.0°F**: `5.0 pts` (Extreme freeze or excessive heat)

#### 3. Weather Condition Factor (Max: 40.0 Points) — Open-Meteo
- **Clear sky / Mainly clear** (WMO codes 0, 1): `40.0 pts`
- **Partly cloudy / Overcast** (WMO codes 2, 3): `32.0 pts`
- **Fog / Drizzle / Rime fog** (WMO codes 45, 48, 51–57): `20.0 pts`
- **Rain / Snow / Showers** (WMO codes 61–86): `10.0 pts`
- **Thunderstorm / Severe Weather / Hail** (WMO codes 95–99): `0.0 pts`

---

### Unavailable Data Handling

Public APIs can intermittently fail, timeout, or lack coverage. LOCO adheres strictly to these core resilience requirements:

1. **Never Crash:** A failed third-party API call never aborts the assessment.
2. **Never Treat as Zero:** Missing data is never penalized as 0 points. It is recorded with:
   - `points = NULL`
   - `raw_value = NULL`
   - `status = "unavailable"`
   - `reason = "Descriptive error message"`
3. **Proportional Re-scaling:** When 1 or 2 factors are unavailable, the overall 0–100 score is calculated proportionally from the available factors:
   $$\text{Total Score} = \text{round}\left( \frac{\sum \text{Earned Points from Available Factors}}{\sum \text{Max Points of Available Factors}} \times 100 \right)$$
4. **All Factors Unavailable:** If all external APIs fail, `total_score = NULL` (`None`) and the UI clearly warns that data could not be retrieved.

---

### REST API Specifications

#### `POST /api/assessments`
Create and evaluate a new location. Accepts either an address or GPS coordinates.

**Request Payload (Address):**
```json
{
  "label": "Austin Logistics Center",
  "address": "1100 Congress Ave, Austin, TX 78701"
}
```

**Request Payload (Coordinates):**
```json
{
  "label": "Denver Hub",
  "latitude": 39.7392,
  "longitude": -104.9903
}
```

**Response (`201 Created`):**
```json
{
  "id": "e81d7f6b-0294-4322-a72d-ef34cfd2b11a",
  "label": "Austin Logistics Center",
  "address": "1100 Congress Ave, Austin, TX 78701",
  "latitude": 30.2747,
  "longitude": -97.7404,
  "total_score": 92.0,
  "created_at": "2026-10-03T11:45:00Z",
  "factors": [
    {
      "id": "f1b4...",
      "factor_name": "Elevation",
      "raw_value": "505.2 ft",
      "points": 30.0,
      "max_points": 30.0,
      "source": "USGS Elevation Service",
      "status": "available",
      "reason": null
    },
    {
      "id": "f2c5...",
      "factor_name": "Temperature",
      "raw_value": "73.4°F",
      "points": 30.0,
      "max_points": 30.0,
      "source": "Open-Meteo",
      "status": "available",
      "reason": null
    },
    {
      "id": "f3d6...",
      "factor_name": "Weather Condition",
      "raw_value": "Partly cloudy",
      "points": 32.0,
      "max_points": 40.0,
      "source": "Open-Meteo",
      "status": "available",
      "reason": null
    }
  ]
}
```

#### `GET /api/assessments`
Returns a list of all historical assessments sorted by `created_at` descending.

#### `GET /api/assessments/{id}`
Returns a single assessment with complete factor status and breakdown.

#### `GET /health`
Returns API health status: `{"status": "ok", "app": "LOCO Location Assessment API"}`.

---

## 4. 🧪 Tests

### Running the Test Suite

Run the automated Pytest test suite from the `backend/` directory:

```bash
cd backend
pytest -v
```

Or using the virtual environment python runner directly on Windows:
```powershell
.\venv\Scripts\pytest -v
```

---

### Test Scenarios Covered

The test suite in [`backend/tests/test_scoring.py`](backend/tests/test_scoring.py) rigorously validates the scoring rules and unavailable-data handling:

1. **`test_normal_available_factors`**  
   Validates standard scoring when all 3 data sources return nominal values within ideal ranges (e.g. elevation 500 ft, temperature 72°F, clear sky). Confirms the exact expected total score is calculated.

2. **`test_high_and_low_values`**  
   Validates boundary and extreme values (e.g., elevation 12,000 ft, temperature 15°F, thunderstorm). Ensures correct minimum point tiers are awarded.

3. **`test_unavailable_factor_is_not_zero`**  
   **Critical requirement:** Verifies that when an API is down or unavailable:
   - `points` is strictly `None` (never set to `0.0`).
   - `status` is `"unavailable"`.
   - The overall score is proportionally re-scaled against the remaining available factors instead of unfairly penalizing the location.

4. **`test_multiple_unavailable_factors`**  
   Simulates 2 out of 3 public APIs failing simultaneously. Verifies that the single remaining factor correctly scales to represent the entire 0–100 score.

5. **`test_all_factors_unavailable`**  
   Simulates an outage of all 3 external data sources. Verifies that `total_score` evaluates strictly to `None` and does not crash or emit an invalid number.

6. **`test_score_boundaries`**  
   Verifies that across all possible input variations, calculated scores are strictly clamped within the valid range $[0, 100]$.

---

## 📄 License

MIT License.
