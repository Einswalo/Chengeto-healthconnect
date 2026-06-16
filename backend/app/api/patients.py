from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.database import get_db
from app.schemas.patient import PatientCreate, PatientResponse
from app.schemas.auth import UserRegister
from app.services.patient_service import PatientService
from app.models.user import User
from app.models.patient import Patient
from app.core.access_control import require_patient_access
from app.api.auth import get_current_user

router = APIRouter(prefix="/patients", tags=["Patients"])


class PatientRegistration(UserRegister):
    first_name: str
    last_name: str
    date_of_birth: str
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
async def register_patient(
    registration_data: PatientRegistration,
    db: Session = Depends(get_db)
):
    """Register a new patient. No auth required — doctor registers on behalf of patient."""
    try:
        dob = datetime.strptime(registration_data.date_of_birth, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date_of_birth format. Use YYYY-MM-DD"
        )

    user_data = UserRegister(
        email=registration_data.email,
        password=registration_data.password,
        user_type="patient"
    )

    patient_data = PatientCreate(
        first_name=registration_data.first_name,
        last_name=registration_data.last_name,
        date_of_birth=dob,
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

    try:
        patient = PatientService.create_patient(db, user_data, patient_data)
        return patient
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ✅ /me and /search MUST come before /{patient_id}
@router.get("/me", response_model=PatientResponse)
async def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current patient's own profile."""
    if current_user.user_type != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can access this endpoint"
        )
    return PatientService.get_patient_by_user_id(db, current_user.user_id)


@router.get("/search", response_model=List[PatientResponse])
async def search_patients(
    q: str = None,
    city: str = None,
    blood_type: str = None,
    gender: str = None,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search patients. Requires: doctor, nurse, or admin."""
    role = current_user.user_type.strip().lower()
    if role not in ["doctor", "nurse", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied for role: {current_user.user_type}"
        )
    patients, _total = PatientService.search_patients(
        db=db, search_query=q, city=city,
        blood_type=blood_type, gender=gender,
        skip=skip, limit=limit
    )
    return patients


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get patient by ID."""
    require_patient_access(db, user=current_user, patient_id=patient_id)
    return PatientService.get_patient_by_id(db, patient_id)


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: int,
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update patient profile."""
    patient = PatientService.get_patient_by_id(db, patient_id)
    if patient.user_id != current_user.user_id and current_user.user_type not in ["admin", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )
    return PatientService.update_patient(db, patient_id, patient_data)