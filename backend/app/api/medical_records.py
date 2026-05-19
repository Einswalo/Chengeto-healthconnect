from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordUpdate, MedicalRecordResponse
from app.services.medical_record_service import MedicalRecordService
from app.models.user import User
from app.core.access_control import require_patient_access
from app.core.roles import CLINICAL_STAFF
from app.api.auth import get_current_user

router = APIRouter(prefix="/medical-records", tags=["Medical Records"])


# ✅ /patient/{patient_id} MUST come before /{record_id} to avoid route conflict
@router.get("/patient/{patient_id}", response_model=List[MedicalRecordResponse])
async def get_patient_medical_records(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all medical records for a patient.

    - Patients can view their own records (read-only)
    - Doctors/nurses/admins need active consent or emergency access
    """
    require_patient_access(db, user=current_user, patient_id=patient_id)
    records = MedicalRecordService.get_patient_medical_records(db, patient_id)
    return records


@router.get("/{record_id}", response_model=MedicalRecordResponse)
async def get_medical_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a single medical record by ID.

    - Patients can view their own records
    - Providers need consent/emergency access
    """
    record = MedicalRecordService.get_medical_record_by_id(db, record_id)
    # Verify the requester has access to this patient's data
    require_patient_access(db, user=current_user, patient_id=record.patient_id)
    return record


@router.post("/", response_model=MedicalRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_medical_record(
    record_data: MedicalRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new medical record.

    Requires: doctor, nurse, or admin role.
    Patients cannot create records — records are written by providers.
    """
    if current_user.user_type not in CLINICAL_STAFF:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only healthcare providers can create medical records"
        )
    # Provider must also have access to this patient
    require_patient_access(db, user=current_user, patient_id=record_data.patient_id)

    record = MedicalRecordService.create_medical_record(db, record_data)
    return record


@router.put("/{record_id}", response_model=MedicalRecordResponse)
async def update_medical_record(
    record_id: int,
    update: MedicalRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing medical record.

    Requires: doctor, nurse, or admin role.
    Patients cannot edit records.
    """
    if current_user.user_type not in CLINICAL_STAFF:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only healthcare providers can update medical records"
        )
    record = MedicalRecordService.get_medical_record_by_id(db, record_id)
    require_patient_access(db, user=current_user, patient_id=record.patient_id)

    updated = MedicalRecordService.update_medical_record(db, record_id, update)
    return updated
