from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.ai_prediction import AIPredictionCreate, AIPredictionResponse
from app.services.ai_service import AIService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/ai", tags=["AI Disease Prediction"])

@router.post("/predict", response_model=AIPredictionResponse, status_code=status.HTTP_201_CREATED)
async def predict_disease(
    prediction_data: AIPredictionCreate,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Predict disease using AI based on symptoms and vital signs
    
    Requires: JWT token (doctor/nurse/admin)
    
    - **patient_id**: Patient's ID
    - **symptoms**: Detailed symptoms (e.g., "High fever, chills, headache, body aches")
    - **vital_signs**: Optional dict with temperature, heart_rate, blood_pressure, etc.
    - **patient_location**: Optional location (e.g., "Kariba" for malaria-endemic areas)
    
    AI analyzes and predicts:
    - Malaria (focus for Zimbabwe)
    - Typhoid
    - Tuberculosis
    - Pneumonia
    - Other common diseases
    
    Returns diagnosis with confidence score (0-100%)
    """
    user = AuthService.get_current_user(db, token)
    
    # Only healthcare providers can request AI predictions
    if user.user_type not in ["doctor", "nurse", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only healthcare providers can request AI predictions"
        )
    
    prediction = AIService.predict_disease(db, prediction_data)
    return prediction

@router.get("/predictions/{prediction_id}", response_model=AIPredictionResponse)
async def get_prediction(
    prediction_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get AI prediction by ID
    
    Requires: JWT token
    """
    user = AuthService.get_current_user(db, token)
    prediction = AIService.get_prediction_by_id(db, prediction_id)
    return prediction

@router.get("/predictions/patient/{patient_id}", response_model=List[AIPredictionResponse])
async def get_patient_predictions(
    patient_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get all AI predictions for a patient
    
    Requires: JWT token
    
    Shows history of AI-assisted diagnoses
    """
    user = AuthService.get_current_user(db, token)
    predictions = AIService.get_patient_predictions(db, patient_id)
    return predictions