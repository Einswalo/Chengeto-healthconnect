from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.emergency_access_log import EmergencyAccessLogCreate, EmergencyAccessLogResponse
from app.services.emergency_access_log_service import EmergencyAccessLogService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/emergency-access", tags=["Emergency Access"])

@router.post("/", response_model=EmergencyAccessLogResponse, status_code=status.HTTP_201_CREATED)
async def request_emergency_access(
    log_data: EmergencyAccessLogCreate,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Request emergency access to patient data
    
    Requires: JWT token (doctor/nurse/admin)
    
    Use when patient is unconscious or unable to provide consent.
    Creates permanent blockchain-verified audit trail.
    
    - **patient_id**: Patient's ID
    - **access_reason**: Justification for emergency access
    
    Example reasons:
    - "Patient unconscious, requiring immediate treatment"
    - "Life-threatening emergency, patient unable to consent"
    - "Critical condition, family unavailable for consent"
    """
    user = AuthService.get_current_user(db, token)
    
    # Only healthcare providers can request emergency access
    if user.user_type not in ["doctor", "nurse", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only healthcare providers can request emergency access"
        )
    
    log = EmergencyAccessLogService.create_emergency_access(db, log_data)
    return log

@router.get("/{log_id}", response_model=EmergencyAccessLogResponse)
async def get_emergency_access_log(
    log_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get emergency access log by ID
    
    Requires: JWT token
    """
    user = AuthService.get_current_user(db, token)
    log = EmergencyAccessLogService.get_emergency_access_by_id(db, log_id)
    return log

@router.get("/patient/{patient_id}", response_model=List[EmergencyAccessLogResponse])
async def get_patient_emergency_access_logs(
    patient_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get all emergency access logs for a patient
    
    Requires: JWT token
    
    Shows complete audit trail of who accessed patient data during emergencies
    """
    user = AuthService.get_current_user(db, token)
    logs = EmergencyAccessLogService.get_patient_emergency_access_logs(db, patient_id)
    return logs