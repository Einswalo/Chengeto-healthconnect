from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordResponse
from app.services.medical_record_service import MedicalRecordService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/medical-records", tags=["Medical Records"])

@router.post("/", response_model=MedicalRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_medical_record(
    record_data: MedicalRecordCreate,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Create a new medical record
    
    Requires: JWT token (doctor/nurse/admin)
    
    - **patient_id**: Patient's ID
    - **visit_date**: Format "YYYY-MM-DD"
    - **diagnosis**: Medical diagnosis
    - **symptoms**: Patient symptoms
    - **treatment_plan**: Recommended treatment
    """
    # Verify user is authenticated
    user = AuthService.get_current_user(db, token)
    
    # Only doctors, nurses, and admins can create records
    if user.user_type not in ["doctor", "nurse", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only healthcare providers can create medical records"
        )
    
    record = MedicalRecordService.create_medical_record(db, record_data)
    return record

@router.get("/{record_id}", response_model=MedicalRecordResponse)
async def get_medical_record(
    record_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get medical record by ID
    
    Requires: JWT token
    """
    user = AuthService.get_current_user(db, token)
    record = MedicalRecordService.get_medical_record_by_id(db, record_id)
    return record

@router.get("/patient/{patient_id}", response_model=List[MedicalRecordResponse])
async def get_patient_medical_records(
    patient_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get all medical records for a patient
    
    Requires: JWT token
    """
    user = AuthService.get_current_user(db, token)
    records = MedicalRecordService.get_patient_medical_records(db, patient_id)
    return records