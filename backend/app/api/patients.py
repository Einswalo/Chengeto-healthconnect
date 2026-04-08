from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.patient import PatientCreate, PatientResponse
from app.schemas.auth import UserRegister
from app.services.patient_service import PatientService
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter(prefix="/patients", tags=["Patients"])

# Combined schema for patient registration
class PatientRegistration(UserRegister):
    """Combined user + patient registration"""
    first_name: str
    last_name: str
    date_of_birth: str  # Will be converted to date
    gender: str = None
    phone_number: str = None
    address: str = None
    city: str = None
    national_id: str = None
    emergency_contact_name: str = None
    emergency_contact_phone: str = None
    blood_type: str = None
    allergies: str = None
    chronic_conditions: str = None

@router.post("/register", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def register_patient(registration_data: PatientRegistration, db: Session = Depends(get_db)):
    """
    Register a new patient with user account
    
    Creates both:
    - User account (for authentication)
    - Patient profile (medical information)
    """
    from datetime import datetime
    
    # Separate user and patient data
    user_data = UserRegister(
        email=registration_data.email,
        password=registration_data.password,
        user_type="patient"  # Force patient type
    )
    
    patient_data = PatientCreate(
        first_name=registration_data.first_name,
        last_name=registration_data.last_name,
        date_of_birth=datetime.strptime(registration_data.date_of_birth, "%Y-%m-%d").date(),
        gender=registration_data.gender,
        phone_number=registration_data.phone_number,
        address=registration_data.address,
        city=registration_data.city,
        national_id=registration_data.national_id,
        emergency_contact_name=registration_data.emergency_contact_name,
        emergency_contact_phone=registration_data.emergency_contact_phone,
        blood_type=registration_data.blood_type,
        allergies=registration_data.allergies,
        chronic_conditions=registration_data.chronic_conditions
    )
    
    patient = PatientService.create_patient(db, user_data, patient_data)
    return patient

@router.get("/me", response_model=PatientResponse)
async def get_my_profile(token: str, db: Session = Depends(get_db)):
    """
    Get current patient's profile
    
    Requires: JWT token
    """
    user = AuthService.get_current_user(db, token)
    
    if user.user_type != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can access this endpoint"
        )
    
    patient = PatientService.get_patient_by_user_id(db, user.user_id)
    return patient

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: int, token: str, db: Session = Depends(get_db)):
    """
    Get patient by ID
    
    Requires: JWT token
    """
    # Verify user is authenticated
    user = AuthService.get_current_user(db, token)
    
    patient = PatientService.get_patient_by_id(db, patient_id)
    return patient

@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: int, 
    patient_data: PatientCreate, 
    token: str, 
    db: Session = Depends(get_db)
):
    """
    Update patient profile
    
    Requires: JWT token
    Patient can only update their own profile
    """
    user = AuthService.get_current_user(db, token)
    
    # Get patient to check ownership
    patient = PatientService.get_patient_by_id(db, patient_id)
    
    # Check if user owns this patient profile
    if patient.user_id != user.user_id and user.user_type not in ["admin", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )
    
    updated_patient = PatientService.update_patient(db, patient_id, patient_data)
    return updated_patient


@router.get("/search", response_model=List[PatientResponse])
async def search_patients(
    token: str,
    q: str = None,
    city: str = None,
    blood_type: str = None,
    gender: str = None,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Search patients (providers/admin).
    
    Requires: JWT token (doctor/nurse/admin)
    
    Query params:
    - q: name/national_id/phone search
    - city, blood_type, gender: optional filters
    - skip, limit: pagination
    """
    user = AuthService.get_current_user(db, token)
    if user.user_type not in ["doctor", "nurse", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only healthcare providers can search patients"
        )
    
    patients, _total = PatientService.search_patients(
        db,
        search_query=q,
        city=city,
        blood_type=blood_type,
        gender=gender,
        skip=skip,
        limit=limit
    )
    return patients

