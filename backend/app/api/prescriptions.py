from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse
from app.services.prescription_service import PrescriptionService
from app.services.auth_service import AuthService
from app.core.access_control import require_patient_access

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])

@router.post("/", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    prescription_data: PrescriptionCreate,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Create a new prescription
    
    Requires: JWT token (doctor/nurse/admin)
    
    - **patient_id**: Patient's ID
    - **medication_name**: Name of medication (e.g., "Coartem")
    - **dosage**: Dosage amount (e.g., "4 tablets")
    - **frequency**: How often (e.g., "Twice daily")
    - **duration**: Treatment duration (e.g., "3 days")
    - **instructions**: Additional instructions
    
    NOTE: Drug interaction checking requires accreditation from 
    Zimbabwe Ministry of Health and Child Care. This feature will be 
    activated after obtaining proper medical database licensing and 
    regulatory approval (MCAZ - Medicines Control Authority of Zimbabwe).
    
    Healthcare providers should verify drug safety using approved references.
    """
    # Verify user is authenticated
    user = AuthService.get_current_user(db, token)
    
    # Only doctors, nurses, and admins can prescribe
    if user.user_type not in ["doctor", "nurse", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only healthcare providers can create prescriptions"
        )
    
    prescription = PrescriptionService.create_prescription(db, prescription_data)
    return prescription

@router.get("/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription(
    prescription_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get prescription by ID
    
    Requires: JWT token
    """
    user = AuthService.get_current_user(db, token)
    prescription = PrescriptionService.get_prescription_by_id(db, prescription_id)
    return prescription

@router.get("/patient/{patient_id}", response_model=List[PrescriptionResponse])
async def get_patient_prescriptions(
    patient_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get all prescriptions for a patient
    
    Requires: JWT token
    """
    user = AuthService.get_current_user(db, token)
    require_patient_access(db, user=user, patient_id=patient_id)
    prescriptions = PrescriptionService.get_patient_prescriptions(db, patient_id)
    return prescriptions

@router.put("/{prescription_id}/dispense", response_model=PrescriptionResponse)
async def mark_prescription_dispensed(
    prescription_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Mark prescription as dispensed
    
    Requires: JWT token (pharmacist/admin)
    """
    user = AuthService.get_current_user(db, token)
    
    # Only pharmacists and admins can dispense
    if user.user_type not in ["pharmacist", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only pharmacists can dispense prescriptions"
        )
    
    prescription = PrescriptionService.mark_as_dispensed(db, prescription_id)
    return prescription