from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.db.database import get_db
from app.schemas.ai_prediction import AIPredictionCreate, AIPredictionResponse
from app.services.ai_service import AIService
from app.models.user import User
from app.core.access_control import require_patient_access
from app.core.roles import CLINICAL_STAFF
from app.api.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["AI & Symptom Checker"])


# ── Patient-facing symptom checker ───────────────────────────────────────────

class SymptomCheckRequest(BaseModel):
    """Patient submits their own symptoms for AI guidance."""
    symptoms: str
    patient_location: Optional[str] = None
    vital_signs: Optional[dict] = None


class SymptomCheckResponse(BaseModel):
    """AI response for patient symptom check — advisory only, not a diagnosis."""
    possible_conditions: List[str]
    recommendation: str          # e.g. "Visit a clinic within 24 hours"
    urgency_level: str           # "low" | "moderate" | "high" | "emergency"
    disclaimer: str


@router.post("/symptom-check", response_model=SymptomCheckResponse, status_code=status.HTTP_201_CREATED)
async def patient_symptom_check(
    request: SymptomCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Patient-facing AI symptom checker.

    - Any authenticated user (including patients) can use this
    - Returns advisory guidance — NOT a clinical diagnosis
    - Always recommends consulting a healthcare provider

    This is separate from the clinical prediction tool used by doctors.
    """
    result = AIService.patient_symptom_check(
        symptoms=request.symptoms,
        patient_location=request.patient_location,
        vital_signs=request.vital_signs
    )
    return result


# ── Clinical prediction (providers only) ─────────────────────────────────────

@router.post("/predict", response_model=AIPredictionResponse, status_code=status.HTTP_201_CREATED)
async def predict_disease(
    prediction_data: AIPredictionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Clinical AI disease prediction — for healthcare providers only.

    Requires: doctor, nurse, or admin role + active patient consent.

    AI analyzes symptoms and predicts:
    - Malaria (focus for Zimbabwe)
    - Typhoid
    - Tuberculosis
    - Pneumonia
    - Other common diseases

    Returns diagnosis with confidence score (0–100%).
    """
    if current_user.user_type not in CLINICAL_STAFF:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only healthcare providers can request clinical AI predictions"
        )
    # Provider must have access to this patient's data
    require_patient_access(db, user=current_user, patient_id=prediction_data.patient_id)

    prediction = AIService.predict_disease(db, prediction_data)
    return prediction


# ── Read endpoints ────────────────────────────────────────────────────────────

# ✅ /predictions/patient/{patient_id} MUST come before /predictions/{prediction_id}
@router.get("/predictions/patient/{patient_id}", response_model=List[AIPredictionResponse])
async def get_patient_predictions(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all AI clinical predictions for a patient.

    - Patients can view their own prediction history
    - Providers need consent/emergency access
    """
    require_patient_access(db, user=current_user, patient_id=patient_id)
    predictions = AIService.get_patient_predictions(db, patient_id)
    return predictions


@router.get("/predictions/{prediction_id}", response_model=AIPredictionResponse)
async def get_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a single AI prediction by ID.
    """
    prediction = AIService.get_prediction_by_id(db, prediction_id)
    require_patient_access(db, user=current_user, patient_id=prediction.patient_id)
    return prediction
