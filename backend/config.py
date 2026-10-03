import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # Request timeout for external APIs in seconds (increased to 10.0s for public US Census geocoder reliability)
    HTTP_TIMEOUT: float = float(os.getenv("HTTP_TIMEOUT", "10.0"))
    
    USER_AGENT: str = os.getenv(
        "USER_AGENT", 
        "LocationAssessmentTool/1.0 (production@loco.internal)"
    )
    
    ALLOWED_ORIGINS: list[str] = [
        origin.strip() 
        for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",") 
        if origin.strip()
    ]

settings = Settings()
