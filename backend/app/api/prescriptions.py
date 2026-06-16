from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse
from app.services.prescription_service import PrescriptionService
from app.models.prescription import Prescription
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
    """Get all prescriptions for a patient."""
    require_patient_access(db, user=current_user, patient_id=patient_id)
    return PrescriptionService.get_patient_prescriptions(db, patient_id)


# ✅ /pending — pharmacist sees all undispensed prescriptions
@router.get("/pending", response_model=List[PrescriptionResponse])
async def get_pending_prescriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all pending (undispensed) prescriptions.
    Requires: pharmacist or admin role.
    """
    if current_user.user_type not in DISPENSERS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only pharmacists can view pending prescriptions"
        )
    prescriptions = db.query(Prescription).filter(
        Prescription.is_dispensed == False
    ).order_by(Prescription.created_at.desc()).all()
    return prescriptions


# ✅ /verify/{token} — lookup by blockchain token
@router.get("/verify/{blockchain_token}", response_model=PrescriptionResponse)
async def verify_prescription_by_token(
    blockchain_token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verify and retrieve a prescription by blockchain token.
    Used by pharmacists to look up a prescription.
    """
    if current_user.user_type not in DISPENSERS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only pharmacists can verify prescriptions"
        )
    prescription = db.query(Prescription).filter(
        Prescription.blockchain_token == blockchain_token
    ).first()
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found. Invalid or expired token."
        )
    return prescription


@router.get("/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single prescription by ID."""
    prescription = PrescriptionService.get_prescription_by_id(db, prescription_id)
    require_patient_access(db, user=current_user, patient_id=prescription.patient_id)
    return prescription


@router.post("/", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    prescription_data: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new prescription. Requires: doctor, nurse, or admin."""
    if current_user.user_type not in CLINICAL_STAFF:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only healthcare providers can create prescriptions"
        )
    require_patient_access(db, user=current_user, patient_id=prescription_data.patient_id)
    return PrescriptionService.create_prescription(db, prescription_data)


@router.put("/{prescription_id}/dispense", response_model=PrescriptionResponse)
async def mark_prescription_dispensed(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a prescription as dispensed.
    Requires: pharmacist or admin role.
    Records the dispensing event in the audit log.
    """
    if current_user.user_type not in DISPENSERS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only pharmacists can dispense prescriptions"
        )
    return PrescriptionService.mark_as_dispensed(db, prescription_id)