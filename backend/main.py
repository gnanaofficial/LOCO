import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routes.assessments import router as assessments_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

app = FastAPI(
    title="LOCO - Location Assessment API",
    description="API for converting US locations/coordinates, fetching public facts, scoring locations, and saving assessments.",
    version="1.0.0"
)

# Production CORS: allow Vercel frontend + localhost dev
CORS_ORIGINS = [
    "https://loco-lake.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

if settings.ALLOWED_ORIGINS and settings.ALLOWED_ORIGINS != ["*"]:
    for o in settings.ALLOWED_ORIGINS:
        if o not in CORS_ORIGINS:
            CORS_ORIGINS.append(o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assessments_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "app": "LOCO Location Assessment API"}

if __name__ == "__main__":
    import uvicorn
    # Zoho Catalyst AppSail injects the port via X_ZOHO_CATALYST_LISTEN_PORT
    port = int(os.environ.get("X_ZOHO_CATALYST_LISTEN_PORT", os.environ.get("PORT", "8080")))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
