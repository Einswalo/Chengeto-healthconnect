from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.healthcare_provider import HealthcareProviderCreate, HealthcareProviderResponse
from app.schemas.auth import UserRegister
from app.services.healthcare_provider_service import HealthcareProviderService
from app.services.auth_service import AuthService
from app.core.roles import ADMIN_ONLY

router = APIRouter(prefix="/providers", tags=["Healthcare Providers"])

# Combined schema for provider registration
class ProviderRegistration(UserRegister):
    """Combined user + provider registration"""
    first_name: str
    last_name: str
    provider_type: str  # Doctor, Nurse, Specialist
    specialization: str = None
    license_number: str
    phone_number: str = None

@router.post("/register", response_model=HealthcareProviderResponse, status_code=status.HTTP_201_CREATED)
async def register_provider(
    registration_data: ProviderRegistration,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Register a new healthcare provider (doctor/nurse)
    
    Requires: JWT token (admin only)
    
    Creates both:
    - User account (for authentication)
    - Provider profile (medical credentials)
    
    - **email**: Provider's email
    - **password**: Account password
    - **user_type**: doctor, nurse, or admin
    - **first_name**: First name
    - **last_name**: Last name
    - **provider_type**: Doctor, Nurse, Specialist
    - **specialization**: Medical specialization (optional)
    - **license_number**: Medical license number
    - **phone_number**: Contact number
    """
    # Verify user is authenticated and is admin
    user = AuthService.get_current_user(db, token)
    
    if user.user_type != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can register healthcare providers"
        )
    
    # Separate user and provider data
    user_data = UserRegister(
        email=registration_data.email,
        password=registration_data.password,
        user_type=registration_data.user_type
    )
    
    provider_data = HealthcareProviderCreate(
        first_name=registration_data.first_name,
        last_name=registration_data.last_name,
        provider_type=registration_data.provider_type,
        specialization=registration_data.specialization,
        license_number=registration_data.license_number,
        phone_number=registration_data.phone_number
    )
    
    provider = HealthcareProviderService.create_provider(db, user_data, provider_data)
    return provider

@router.get("/{provider_id}", response_model=HealthcareProviderResponse)
async def get_provider(
    provider_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get healthcare provider by ID
    
    Requires: JWT token
    """
    user = AuthService.get_current_user(db, token)
    provider = HealthcareProviderService.get_provider_by_id(db, provider_id)
    return provider


@router.get("/me", response_model=HealthcareProviderResponse)
async def get_my_provider_profile(token: str, db: Session = Depends(get_db)):
    """
    Get current provider profile.
    
    Requires: JWT token (doctor/nurse/specialist/admin with provider profile)
    """
    user = AuthService.get_current_user(db, token)
    provider = HealthcareProviderService.get_provider_by_user_id(db, user.user_id)
    return provider