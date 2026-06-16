from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.vital_sign import VitalSignCreate, VitalSignResponse
from app.services.vital_sign_service import VitalSignService
from app.core.dependencies import get_current_user
from app.core.roles import CLINICAL_STAFF
from app.core.access_control import require_patient_access

router = APIRouter(prefix="/vital-signs", tags=["Vital Signs"])


@router.post("/", response_model=VitalSignResponse, status_code=status.HTTP_201_CREATED)
async def record_vital_signs(
    vital_data: VitalSignCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    if current_user.user_type not in CLINICAL_STAFF:
        raise HTTPException(
            status_code=403,
            detail="Only clinical staff can record vitals"
        )

    return VitalSignService.create_vital_sign(db, vital_data)


@router.get("/{vital_id}", response_model=VitalSignResponse)
async def get_vital_sign(
    vital_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    vital = VitalSignService.get_vital_sign_by_id(db, vital_id)

    require_patient_access(
        db,
        user=current_user,
        patient_id=vital.patient_id
    )

    return vital


@router.get("/patient/{patient_id}", response_model=List[VitalSignResponse])
async def get_patient_vitals(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    require_patient_access(
        db,
        user=current_user,
        patient_id=patient_id
    )

    return VitalSignService.get_patient_vital_signs(db, patient_id)