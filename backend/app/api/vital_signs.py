from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.vital_sign import VitalSignCreate, VitalSignResponse
from app.services.vital_sign_service import VitalSignService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/vital-signs", tags=["Vital Signs"])

@router.post("/", response_model=VitalSignResponse, status_code=status.HTTP_201_CREATED)
async def record_vital_signs(
    vital_data: VitalSignCreate,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Record vital signs for a patient
    
    Requires: JWT token (nurse/doctor/admin)
    
    - **patient_id**: Patient's ID
    - **temperature**: Body temperature in °C
    - **blood_pressure_systolic**: Top number (e.g., 120)
    - **blood_pressure_diastolic**: Bottom number (e.g., 80)
    - **heart_rate**: Beats per minute
    - **respiratory_rate**: Breaths per minute
    - **weight**: Weight in kg
    - **height**: Height in cm
    """
    # Verify user is authenticated
    user = AuthService.get_current_user(db, token)
    
    # Only healthcare staff can record vitals
    if user.user_type not in ["doctor", "nurse", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only healthcare providers can record vital signs"
        )
    
    vital = VitalSignService.create_vital_sign(db, vital_data)
    return vital

@router.get("/{vital_id}", response_model=VitalSignResponse)
async def get_vital_sign(
    vital_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get vital sign record by ID
    
    Requires: JWT token
    """
    user = AuthService.get_current_user(db, token)
    vital = VitalSignService.get_vital_sign_by_id(db, vital_id)
    return vital

@router.get("/patient/{patient_id}", response_model=List[VitalSignResponse])
async def get_patient_vital_signs(
    patient_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get all vital signs for a patient
    
    Requires: JWT token
    """
    user = AuthService.get_current_user(db, token)
    vitals = VitalSignService.get_patient_vital_signs(db, patient_id)
    return vitals