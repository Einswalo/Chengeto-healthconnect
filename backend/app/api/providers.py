from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.schemas.healthcare_provider import HealthcareProviderCreate, HealthcareProviderResponse
from app.schemas.auth import UserRegister
from app.services.healthcare_provider_service import HealthcareProviderService
from app.services.facility_service import FacilityService
from app.models.user import User
from app.models.facility import Facility
from app.api.auth import get_current_user

router = APIRouter(prefix="/providers", tags=["Healthcare Providers"])


class ProviderRegistration(UserRegister):
    first_name: str
    last_name: str
    provider_type: str
    specialization: Optional[str] = None
    license_number: str
    phone_number: Optional[str] = None
    facility_id: Optional[int] = None  # This links to facilities


# Get current provider profile
@router.get("/me", response_model=HealthcareProviderResponse)
async def get_my_provider_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current provider profile. Requires: doctor/nurse/admin."""
    provider = HealthcareProviderService.get_provider_by_user_id(db, current_user.user_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No provider profile found for this user"
        )
    
    # Get facility name from the facilities table
    facility_name = None
    if provider.facility_id:
        facility = db.query(Facility).filter(Facility.facility_id == provider.facility_id).first()
        if facility:
            facility_name = facility.facility_name
    
    return HealthcareProviderResponse(
        provider_id=provider.provider_id,
        user_id=provider.user_id,
        first_name=provider.first_name,
        last_name=provider.last_name,
        provider_type=provider.provider_type,
        specialization=provider.specialization,
        license_number=provider.license_number,
        phone_number=provider.phone_number,
        facility_id=provider.facility_id,
        facility_name=facility_name,
        created_at=provider.created_at
    )


# List all providers
@router.get("/", response_model=List[HealthcareProviderResponse])
async def list_providers(
    provider_type: Optional[str] = Query(None),
    facility_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all healthcare providers. Any authenticated user."""
    
    if facility_id:
        providers = HealthcareProviderService.get_providers_by_facility(db, facility_id)
    else:
        providers = HealthcareProviderService.get_all_providers(db, provider_type, skip, limit)
    
    # Build response with facility names from the facilities table
    result = []
    for provider in providers:
        facility_name = None
        if provider.facility_id:
            facility = db.query(Facility).filter(Facility.facility_id == provider.facility_id).first()
            if facility:
                facility_name = facility.facility_name
        
        result.append(HealthcareProviderResponse(
            provider_id=provider.provider_id,
            user_id=provider.user_id,
            first_name=provider.first_name,
            last_name=provider.last_name,
            provider_type=provider.provider_type,
            specialization=provider.specialization,
            license_number=provider.license_number,
            phone_number=provider.phone_number,
            facility_id=provider.facility_id,
            facility_name=facility_name,
            created_at=provider.created_at
        ))
    
    return result


# Register Provider
@router.post("/register", response_model=HealthcareProviderResponse, status_code=status.HTTP_201_CREATED)
async def register_provider(
    registration_data: ProviderRegistration,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register a new healthcare provider. Admin only."""
    if current_user.user_type != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can register healthcare providers"
        )
    
    # Validate facility exists if provided (check the facilities table)
    if registration_data.facility_id:
        facility = db.query(Facility).filter(Facility.facility_id == registration_data.facility_id).first()
        if not facility:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Facility with ID {registration_data.facility_id} not found. Please register the facility first."
            )
    
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
        phone_number=registration_data.phone_number,
        facility_id=registration_data.facility_id
    )
    provider = HealthcareProviderService.create_provider(db, user_data, provider_data)
    
    # Get facility name from the facilities table
    facility_name = None
    if provider.facility_id:
        facility = db.query(Facility).filter(Facility.facility_id == provider.facility_id).first()
        if facility:
            facility_name = facility.facility_name
    
    return HealthcareProviderResponse(
        provider_id=provider.provider_id,
        user_id=provider.user_id,
        first_name=provider.first_name,
        last_name=provider.last_name,
        provider_type=provider.provider_type,
        specialization=provider.specialization,
        license_number=provider.license_number,
        phone_number=provider.phone_number,
        facility_id=provider.facility_id,
        facility_name=facility_name,
        created_at=provider.created_at
    )


# Get provider by ID
@router.get("/{provider_id}", response_model=HealthcareProviderResponse)
async def get_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get provider by ID."""
    provider = HealthcareProviderService.get_provider_by_id(db, provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found"
        )
    
    # Get facility name from the facilities table
    facility_name = None
    if provider.facility_id:
        facility = db.query(Facility).filter(Facility.facility_id == provider.facility_id).first()
        if facility:
            facility_name = facility.facility_name
    
    return HealthcareProviderResponse(
        provider_id=provider.provider_id,
        user_id=provider.user_id,
        first_name=provider.first_name,
        last_name=provider.last_name,
        provider_type=provider.provider_type,
        specialization=provider.specialization,
        license_number=provider.license_number,
        phone_number=provider.phone_number,
        facility_id=provider.facility_id,
        facility_name=facility_name,
        created_at=provider.created_at
    )

# Update Provider (Admin only)
@router.put("/{provider_id}", response_model=HealthcareProviderResponse)
async def update_provider(
    provider_id: int,
    provider_data: HealthcareProviderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a healthcare provider. Admin only."""
    if current_user.user_type != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update healthcare providers"
        )
    
    provider = HealthcareProviderService.get_provider_by_id(db, provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found"
        )
    
    # Update provider fields
    provider.first_name = provider_data.first_name
    provider.last_name = provider_data.last_name
    provider.provider_type = provider_data.provider_type
    provider.specialization = provider_data.specialization
    provider.license_number = provider_data.license_number
    provider.phone_number = provider_data.phone_number
    provider.facility_id = provider_data.facility_id
    
    db.commit()
    db.refresh(provider)
    
    # Get facility name
    facility_name = None
    if provider.facility_id:
        from app.services.facility_service import FacilityService
        facility = FacilityService.get_facility_by_id(db, provider.facility_id)
        if facility:
            facility_name = facility.facility_name
    
    return HealthcareProviderResponse(
        provider_id=provider.provider_id,
        user_id=provider.user_id,
        first_name=provider.first_name,
        last_name=provider.last_name,
        provider_type=provider.provider_type,
        specialization=provider.specialization,
        license_number=provider.license_number,
        phone_number=provider.phone_number,
        facility_id=provider.facility_id,
        facility_name=facility_name,
        created_at=provider.created_at
    )