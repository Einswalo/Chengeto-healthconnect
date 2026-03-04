from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# AI Prediction Request
class AIPredictionCreate(BaseModel):
    patient_id: int
    record_id: Optional[int] = None
    symptoms: str  # Comma-separated or detailed description
    vital_signs: Optional[dict] = None  # Temperature, BP, heart rate, etc.
    patient_location: Optional[str] = None  # e.g., "Kariba" for endemic areas

# AI Prediction Response
class AIPredictionResponse(BaseModel):
    prediction_id: int
    patient_id: int
    record_id: Optional[int]
    symptoms: str
    predicted_condition: Optional[str]
    confidence_score: Optional[float]
    ai_model_version: Optional[str]
    prediction_date: datetime
    
    class Config:
        from_attributes = True