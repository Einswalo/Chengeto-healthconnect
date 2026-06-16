from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.consent_record import ConsentRecordCreate, ConsentRecordResponse
from app.services.consent_record_service import ConsentRecordService
from app.core.access_control import require_patient_access

from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/consent", tags=["Consent Management"])


# =========================
# GRANT CONSENT
# =========================
@router.post(
    "/",
    response_model=ConsentRecordResponse,
    status_code=status.HTTP_201_CREATED
)
async def grant_consent(
    consent_data: ConsentRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.user_type == "patient":

        from app.services.patient_service import PatientService

        patient = PatientService.get_patient_by_user_id(
            db,
            current_user.user_id
        )

        if patient.patient_id != consent_data.patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only grant consent for yourself"
            )

    consent = ConsentRecordService.create_consent(db, consent_data)
    return consent


# =========================
# GET SINGLE CONSENT
# =========================
@router.get(
    "/{consent_id}",
    response_model=ConsentRecordResponse
)
async def get_consent(
    consent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    consent = ConsentRecordService.get_consent_by_id(db, consent_id)
    return consent


# =========================
# GET PATIENT CONSENTS
# =========================
@router.get(
    "/patient/{patient_id}",
    response_model=List[ConsentRecordResponse]
)
async def get_patient_consents(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    require_patient_access(
        db,
        user=current_user,
        patient_id=patient_id
    )

    return ConsentRecordService.get_patient_consents(db, patient_id)


# =========================
# REVOKE CONSENT
# =========================
@router.put(
    "/{consent_id}/revoke",
    response_model=ConsentRecordResponse
)
async def revoke_consent(
    consent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return ConsentRecordService.revoke_consent(db, consent_id)