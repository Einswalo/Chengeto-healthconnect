from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.schemas.facility import FacilityCreate, FacilityResponse
from app.services.facility_service import FacilityService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/facilities", tags=["Facilities"])

@router.post("/", response_model=FacilityResponse, status_code=status.HTTP_201_CREATED)
async def register_facility(
    facility_data: FacilityCreate,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Register a new healthcare facility
    
    Requires: JWT token (admin only)
    
    - **facility_name**: Name of facility (e.g., "Harare Central Clinic")
    - **facility_type**: Type (Hospital, Clinic, Health Center, Pharmacy)
    - **address**: Physical address
    - **city**: City location
    - **phone_number**: Contact number
    - **email**: Contact email
    """
    # Verify user is authenticated
    user = AuthService.get_current_user(db, token)
    
    # Only admins can register facilities
    if user.user_type != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can register facilities"
        )
    
    facility = FacilityService.create_facility(db, facility_data)
    return facility

@router.get("/", response_model=List[FacilityResponse])
async def get_facilities(
    facility_type: Optional[str] = Query(None, description="Filter by type (Hospital, Clinic, etc.)"),
    city: Optional[str] = Query(None, description="Filter by city"),
    db: Session = Depends(get_db)
):
    """
    Get all facilities
    
    Optional filters:
    - **facility_type**: Filter by type
    - **city**: Filter by city
    
    No authentication required (public endpoint)
    """
    facilities = FacilityService.get_all_facilities(db, facility_type, city)
    return facilities

@router.get("/{facility_id}", response_model=FacilityResponse)
async def get_facility(
    facility_id: int,
    db: Session = Depends(get_db)
):
    """
    Get facility details by ID
    
    No authentication required (public endpoint)
    """
    facility = FacilityService.get_facility_by_id(db, facility_id)
    return facility