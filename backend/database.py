import logging
import uuid
import sqlite3
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from config import settings

logger = logging.getLogger(__name__)

# Initialize Supabase client if credentials provided
supabase_client = None
if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
    try:
        from supabase import create_client
        supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        logger.info("Supabase client successfully initialized.")
    except Exception as e:
        logger.warning(f"Could not initialize Supabase client: {e}. Falling back to local database.")

# In-memory / local SQLite fallback database setup
LOCAL_DB_FILE = "loco_assessments.db"

def init_local_db():
    conn = sqlite3.connect(LOCAL_DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS assessments (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            address TEXT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            total_score REAL,
            created_at TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS assessment_factors (
            id TEXT PRIMARY KEY,
            assessment_id TEXT NOT NULL,
            factor_name TEXT NOT NULL,
            raw_value TEXT,
            points REAL,
            max_points REAL NOT NULL,
            source TEXT NOT NULL,
            status TEXT NOT NULL,
            reason TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
        )
    """)
    conn.commit()
    conn.close()

init_local_db()


async def save_assessment(
    label: str,
    latitude: float,
    longitude: float,
    address: Optional[str],
    total_score: Optional[float],
    factors: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Saves a new assessment and its breakdown factors into Supabase PostgreSQL
    (or local database fallback).
    """
    assessment_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    assessment_record = {
        "id": assessment_id,
        "label": label,
        "address": address,
        "latitude": latitude,
        "longitude": longitude,
        "total_score": total_score,
        "created_at": now_iso
    }

    factor_records = []
    for f in factors:
        factor_records.append({
            "id": str(uuid.uuid4()),
            "assessment_id": assessment_id,
            "factor_name": f["factor_name"],
            "raw_value": f["raw_value"],
            "points": f["points"],
            "max_points": f["max_points"],
            "source": f["source"],
            "status": f["status"],
            "reason": f["reason"],
            "created_at": now_iso
        })

    # 1. Try saving to Supabase if configured
    if supabase_client is not None:
        try:
            # Insert assessment
            res = supabase_client.table("assessments").insert(assessment_record).execute()
            if res.data:
                # Insert factor records
                supabase_client.table("assessment_factors").insert(factor_records).execute()
                assessment_record["factors"] = factor_records
                return assessment_record
        except Exception as e:
            logger.error(f"Error saving to Supabase: {e}. Falling back to local DB.")

    # 2. Local SQLite fallback
    conn = sqlite3.connect(LOCAL_DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO assessments (id, label, address, latitude, longitude, total_score, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (assessment_id, label, address, latitude, longitude, total_score, now_iso)
    )
    for f in factor_records:
        cursor.execute(
            """INSERT INTO assessment_factors (id, assessment_id, factor_name, raw_value, points, max_points, source, status, reason, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                f["id"], f["assessment_id"], f["factor_name"], f["raw_value"],
                f["points"], f["max_points"], f["source"], f["status"], f["reason"], f["created_at"]
            )
        )
    conn.commit()
    conn.close()

    assessment_record["factors"] = factor_records
    return assessment_record


async def list_assessments() -> List[Dict[str, Any]]:
    """
    Retrieves all saved assessments sorted by created_at descending.
    """
    if supabase_client is not None:
        try:
            res = supabase_client.table("assessments").select("*, assessment_factors(*)").order("created_at", desc=True).execute()
            if res.data is not None:
                results = []
                for item in res.data:
                    factors = item.pop("assessment_factors", [])
                    item["factors"] = factors
                    results.append(item)
                return results
        except Exception as e:
            logger.error(f"Error reading from Supabase: {e}. Falling back to local DB.")

    # Local SQLite fallback
    conn = sqlite3.connect(LOCAL_DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM assessments ORDER BY created_at DESC")
    rows = cursor.fetchall()
    results = []
    for row in rows:
        item = dict(row)
        cursor.execute("SELECT * FROM assessment_factors WHERE assessment_id = ? ORDER BY created_at ASC", (item["id"],))
        factor_rows = cursor.fetchall()
        item["factors"] = [dict(fr) for fr in factor_rows]
        results.append(item)
    conn.close()
    return results


async def get_assessment_by_id(assessment_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves a single assessment by ID with all factor breakdown details.
    """
    if supabase_client is not None:
        try:
            res = supabase_client.table("assessments").select("*, assessment_factors(*)").eq("id", assessment_id).execute()
            if res.data and len(res.data) > 0:
                item = res.data[0]
                factors = item.pop("assessment_factors", [])
                item["factors"] = factors
                return item
        except Exception as e:
            logger.error(f"Error fetching from Supabase for ID {assessment_id}: {e}. Falling back to local DB.")

    # Local SQLite fallback
    conn = sqlite3.connect(LOCAL_DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM assessments WHERE id = ?", (assessment_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    item = dict(row)
    cursor.execute("SELECT * FROM assessment_factors WHERE assessment_id = ? ORDER BY created_at ASC", (assessment_id,))
    factor_rows = cursor.fetchall()
    item["factors"] = [dict(fr) for fr in factor_rows]
    conn.close()
    return item
