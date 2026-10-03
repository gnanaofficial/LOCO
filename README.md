# LOCO — Location Assessment Tool

A complete location evaluation prototype built to automate the business decision: **"Is this location worth pursuing?"**

Given a US location (address or geographic coordinates), LOCO fetches real-time public data from external sources, scores the location from 0 to 100 using transparent, deterministic rules, persists the assessment, and displays an operations breakdown.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

---

### 1. Backend Setup & How to Run

Navigate to the `backend` directory:
```bash
cd backend
```

#### Option A: Using Virtual Environment (Recommended)

1. Create a Python virtual environment (if not already created):
   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (Command Prompt):**
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **macOS / Linux:**
     ```bash
     source venv/bin/activate
     ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

#### Option B: Direct Python Execution (Without Activating Virtual Environment)

On Windows PowerShell:
```powershell
.\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

The API server will run at: `http://localhost:8000`  
Interactive API Docs (Swagger): `http://localhost:8000/docs`

---

### 2. Frontend Setup & How to Run

Open a new terminal tab/window and navigate to the `frontend` directory:
```bash
cd frontend
```

1. Install frontend dependencies:
   ```bash
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```

The application will be accessible at: `http://localhost:3000` (or `http://localhost:5173`).

---

### 3. Database Configuration (Supabase PostgreSQL)

LOCO connects to **Supabase PostgreSQL**.

1. Copy `.env.example` to `.env` inside `backend/`:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Set your Supabase credentials in `backend/.env`:
   ```env
   SUPABASE_URL=https://your-supabase-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. Run the table schema in your Supabase SQL Editor (found in `backend/schema.sql`):
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
   ```

*Note: If Supabase environment variables are omitted, LOCO gracefully falls back to a local SQLite database (`loco_assessments.db`) so the app runs out-of-the-box for quick testing.*

---

## 🏗️ Architecture

```
                 React (TypeScript + Tailwind CSS)
                                │
                                │ REST API
                                ▼
                       FastAPI (Python)
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
 US Census Geocoder     USGS Elevation           Open-Meteo
  (Address ➔ Coords)       (Elevation)       (Temp & Weather)
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                ▼
                         Scoring Engine
                    (backend/scoring/rules.py)
                                │
                                ▼
                       Supabase PostgreSQL
                                │
                                ▼
                              React
```

---

## 🔌 Public Data Sources

| Source | Role | Endpoint / Details |
|---|---|---|
| **US Census Geocoder** | Converts US address to latitude & longitude | `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress` |
| **USGS Elevation Service** | Retrieves location elevation in feet | `https://epqs.nationalmap.gov/v1/json` |
| **Open-Meteo Weather API** | Retrieves current temperature (°F) & WMO weather condition | `https://api.open-meteo.com/v1/forecast` |

- Every external HTTP request enforces a **5.0 second timeout** and specifies a custom `User-Agent`.
- External API calls are executed concurrently using Python `asyncio.gather`.

---

## 📊 Scoring Rules & Weighting

All scoring logic lives exclusively in `backend/scoring/rules.py`.

Total Maximum Score: **100 Points**

### 1. Elevation Factor (Max 30 Points) — Source: USGS
- **0 ft – 4,000 ft**: 30.0 pts (Optimal human/commercial altitude)
- **4,001 ft – 7,000 ft**: 25.0 pts (High altitude e.g. Denver 5,280 ft)
- **7,001 ft – 10,000 ft**: 15.0 pts (Very high altitude)
- **> 10,000 ft or < 0 ft**: 5.0 pts (Extreme altitude or below sea level)

### 2. Temperature Factor (Max 30 Points) — Source: Open-Meteo
- **60.0°F – 80.0°F**: 30.0 pts (Ideal comfortable range)
- **45.0°F–59.9°F or 80.1°F–92.0°F**: 22.0 pts (Moderate temperature)
- **30.0°F–44.9°F or 92.1°F–104.0°F**: 12.0 pts (Cold or hot)
- **< 30.0°F or > 104.0°F**: 5.0 pts (Extreme cold or extreme heat)

### 3. Weather Condition Factor (Max 40 Points) — Source: Open-Meteo
- **Clear sky / Mainly clear**: 40.0 pts
- **Partly cloudy / Overcast**: 32.0 pts
- **Fog / Drizzle / Rime fog**: 20.0 pts
- **Rain / Snow / Rain showers**: 10.0 pts
- **Severe Thunderstorm / Heavy Rain / Hail**: 0.0 pts

---

## ⚠️ Unavailable Data Handling (CRITICAL REQUIREMENT)

If an external public API fails or times out:
1. **Never crash the assessment**: The application continues processing remaining factors.
2. **Never treat unavailable as zero (`0`)**: `points = NULL`, `raw_value = NULL`, `status = "unavailable"`, and `reason = "..."`.
3. **Re-scaling scoring strategy**:
   When 1 or 2 factors are unavailable, the overall 0–100 score is computed as:
   $$\text{Total Score} = \text{round}\left( \frac{\text{Earned Points from Available Factors}}{\text{Max Points of Available Factors}} \times 100 \right)$$
   If ALL factors are unavailable, `total_score = NULL`.

---

## 🧪 Running Unit Tests

Run the Pytest suite to verify scoring engine rules and unavailable data handling:

```bash
# From backend directory with venv activated
pytest -v

# Or directly:
.\venv\Scripts\pytest -v
```

Tests cover:
- Normal available factor scoring
- High / low extreme value scoring
- `test_unavailable_factor_is_not_zero()` (verifies points remain `None` and status is `unavailable`)
- Multiple unavailable factor re-scaling
- All factors unavailable (`total_score = None`)
- Score boundaries (0–100)

---

## 💡 Key Architectural Decisions

1. **Why FastAPI?**  
   FastAPI provides asynchronous I/O (`asyncio`), native Pydantic request/response validation, automatic OpenAPI docs, and fast execution speeds.

2. **Why Supabase PostgreSQL over Supabase Auth?**  
   Supabase offers production PostgreSQL without forcing frontend SDK coupling. Storing credentials strictly on the backend keeps service-role keys secure.

3. **Why Re-scaled Scoring for Unavailable Factors?**  
   Converting an API failure to 0 points penalizes a location for infrastructure outages. Re-scaling across available factors provides an unbiased assessment while explicitly warning users of partial data.

4. **Why Light Theme Only?**  
   Operations teams need high-contrast, clean readability for tabular data. A light theme with clean neutral gray borders and subtle status colors provides an internal dashboard aesthetic.

---

## 📄 License
MIT License.
