from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.consent_record import ConsentRecordCreate, ConsentRecordResponse
from app.services.consent_record_service import ConsentRecordService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/consent", tags=["Consent Management"])

@router.post("/", response_model=ConsentRecordResponse, status_code=status.HTTP_201_CREATED)
async def grant_consent(
    consent_data: ConsentRecordCreate,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Grant consent for data access
    
    Requires: JWT token (patient)
    
    - **patient_id**: Patient granting consent
    - **provider_id**: Healthcare provider receiving access
    - **consent_type**: Full Access, Limited Access, or Emergency Only
    - **valid_from**: Start date (YYYY-MM-DD)
    - **valid_until**: End date (YYYY-MM-DD) or None for permanent
    
    Creates blockchain-verified consent record
    """
    user = AuthService.get_current_user(db, token)
    
    # Verify patient is granting their own consent
    if user.user_type == "patient":
        # Get patient record to verify ownership
        from app.services.patient_service import PatientService
        patient = PatientService.get_patient_by_user_id(db, user.user_id)
        
        if patient.patient_id != consent_data.patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only grant consent for yourself"
            )
    
    consent = ConsentRecordService.create_consent(db, consent_data)
    return consent

@router.get("/{consent_id}", response_model=ConsentRecordResponse)
async def get_consent(
    consent_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get consent record by ID
    
    Requires: JWT token
    """
    user = AuthService.get_current_user(db, token)
    consent = ConsentRecordService.get_consent_by_id(db, consent_id)
    return consent

@router.get("/patient/{patient_id}", response_model=List[ConsentRecordResponse])
async def get_patient_consents(
    patient_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get all consent records for a patient
    
    Requires: JWT token
    """
    user = AuthService.get_current_user(db, token)
    consents = ConsentRecordService.get_patient_consents(db, patient_id)
    return consents

@router.put("/{consent_id}/revoke", response_model=ConsentRecordResponse)
async def revoke_consent(
    consent_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Revoke consent
    
    Requires: JWT token (patient)
    """
    user = AuthService.get_current_user(db, token)
    consent = ConsentRecordService.revoke_consent(db, consent_id)
    return consent