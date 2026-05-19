from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse
from app.services.prescription_service import PrescriptionService
from app.models.user import User
from app.core.access_control import require_patient_access
from app.core.roles import CLINICAL_STAFF, DISPENSERS
from app.api.auth import get_current_user

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


# ✅ /patient/{patient_id} MUST come before /{prescription_id}
@router.get("/patient/{patient_id}", response_model=List[PrescriptionResponse])
async def get_patient_prescriptions(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all prescriptions for a patient.

    - Patients can view their own prescriptions (read-only)
    - Providers need active consent or emergency access
    """
    require_patient_access(db, user=current_user, patient_id=patient_id)
    prescriptions = PrescriptionService.get_patient_prescriptions(db, patient_id)
    return prescriptions


@router.get("/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a single prescription by ID.

    - Patients can view their own prescriptions
    - Providers need consent/emergency access
    """
    prescription = PrescriptionService.get_prescription_by_id(db, prescription_id)
    require_patient_access(db, user=current_user, patient_id=prescription.patient_id)
    return prescription


@router.post("/", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    prescription_data: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new prescription.

    Requires: doctor, nurse, or admin role.
    Patients cannot create prescriptions.

    NOTE: Drug interaction checking requires accreditation from
    Zimbabwe Ministry of Health and Child Care. This feature will be
    activated after obtaining proper medical database licensing and
    regulatory approval (MCAZ - Medicines Control Authority of Zimbabwe).
    """
    if current_user.user_type not in CLINICAL_STAFF:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only healthcare providers can create prescriptions"
        )
    # Provider must also have access to this patient
    require_patient_access(db, user=current_user, patient_id=prescription_data.patient_id)

    prescription = PrescriptionService.create_prescription(db, prescription_data)
    return prescription


@router.put("/{prescription_id}/dispense", response_model=PrescriptionResponse)
async def mark_prescription_dispensed(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a prescription as dispensed.

    Requires: pharmacist or admin role.
    """
    if current_user.user_type not in DISPENSERS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only pharmacists can dispense prescriptions"
        )
    prescription = PrescriptionService.mark_as_dispensed(db, prescription_id)
    return prescription
