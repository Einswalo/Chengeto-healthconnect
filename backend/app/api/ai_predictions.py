from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.db.database import get_db
from app.schemas.ai_prediction import AIPredictionCreate, AIPredictionResponse
from app.services.ai_service import AIService
from app.models.user import User
from app.models.ai_prediction import AIPrediction   # ✅ FIX: MISSING IMPORT
from app.core.access_control import require_patient_access
from app.core.roles import CLINICAL_STAFF
from app.api.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["AI & Symptom Checker"])


# ─────────────────────────────────────────────
# PATIENT SYMPTOM CHECK (NOW SAVES TO DB)
# ─────────────────────────────────────────────

class SymptomCheckRequest(BaseModel):
    symptoms: str
    patient_location: Optional[str] = None
    vital_signs: Optional[dict] = None


class SymptomCheckResponse(BaseModel):
    possible_conditions: List[str]
    recommendation: str
    urgency_level: str
    disclaimer: str


@router.post(
    "/symptom-check",
    response_model=SymptomCheckResponse,
    status_code=status.HTTP_201_CREATED
)
async def patient_symptom_check(
    request: SymptomCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Patient AI symptom check + SAVE TO DATABASE
    """

    # 1. RUN AI
    result = AIService.patient_symptom_check(
        symptoms=request.symptoms,
        patient_location=request.patient_location,
        vital_signs=request.vital_signs
    )

    # 2. SAVE TO DATABASE (FIXED PROPERLY)
    try:
        ai_record = AIPrediction(
            patient_id=getattr(current_user, "patient_id", None),  # ✅ FIXED
            symptoms=request.symptoms,
            predicted_condition=",".join(result.get("possible_conditions", [])),
            confidence_score=None,
            ai_model_version="v1-symptom-checker"
        )

        db.add(ai_record)
        db.commit()
        db.refresh(ai_record)

    except Exception as e:
        db.rollback()
        print("❌ AI SAVE ERROR:", str(e))

    # 3. RETURN AI RESPONSE
    return result


# ─────────────────────────────────────────────
# CLINICAL PREDICTION (DOCTORS ONLY)
# ─────────────────────────────────────────────

@router.post(
    "/predict",
    response_model=AIPredictionResponse,
    status_code=status.HTTP_201_CREATED
)
async def predict_disease(
    prediction_data: AIPredictionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.user_type not in CLINICAL_STAFF:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only healthcare providers can request clinical AI predictions"
        )

    require_patient_access(
        db,
        user=current_user,
        patient_id=prediction_data.patient_id
    )

    prediction = AIService.predict_disease(db, prediction_data)
    return prediction


# ─────────────────────────────────────────────
# HISTORY ENDPOINTS (FRONTEND USES THIS)
# ─────────────────────────────────────────────

@router.get(
    "/predictions/patient/{patient_id}",
    response_model=List[AIPredictionResponse]
)
async def get_patient_predictions(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    require_patient_access(db, user=current_user, patient_id=patient_id)

    return AIService.get_patient_predictions(db, patient_id)


@router.get(
    "/predictions/{prediction_id}",
    response_model=AIPredictionResponse
)
async def get_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    prediction = AIService.get_prediction_by_id(db, prediction_id)

    require_patient_access(
        db,
        user=current_user,
        patient_id=prediction.patient_id
    )

    return prediction