import logging
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

# Configurable CORS for Production and Local Development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS if settings.ALLOWED_ORIGINS else ["*"],
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
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
