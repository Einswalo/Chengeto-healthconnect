from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.schemas.facility import FacilityCreate, FacilityResponse
from app.services.facility_service import FacilityService
from app.api.auth import get_current_user  # ✅ Use this
from app.models.user import User

router = APIRouter(prefix="/facilities", tags=["Facilities"])


# ✅ REGISTER FACILITY - FIXED
@router.post("/", response_model=FacilityResponse, status_code=status.HTTP_201_CREATED)
async def register_facility(
    facility_data: FacilityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ Use dependency injection
):
    """
    Register a new healthcare facility
    
    Requires: Admin role only
    """
    # Only admins can register facilities
    if current_user.user_type != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can register facilities"
        )
    
    facility = FacilityService.create_facility(db, facility_data)
    return facility


# ✅ GET ALL FACILITIES - Public (no auth needed)
@router.get("/", response_model=List[FacilityResponse])
async def get_facilities(
    facility_type: Optional[str] = Query(None, description="Filter by type"),
    city: Optional[str] = Query(None, description="Filter by city"),
    db: Session = Depends(get_db)
):
    """Get all facilities - Public endpoint"""
    facilities = FacilityService.get_all_facilities(db, facility_type, city)
    return facilities


# ✅ GET FACILITY BY ID - Public
@router.get("/{facility_id}", response_model=FacilityResponse)
async def get_facility(
    facility_id: int,
    db: Session = Depends(get_db)
):
    """Get facility details by ID - Public endpoint"""
    facility = FacilityService.get_facility_by_id(db, facility_id)
    if not facility:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facility not found"
        )
    return facility