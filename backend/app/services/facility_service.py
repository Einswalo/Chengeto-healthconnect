from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.facility import Facility
from app.schemas.facility import FacilityCreate
from typing import List, Optional

class FacilityService:
    
    @staticmethod
    def create_facility(db: Session, facility_data: FacilityCreate) -> Facility:
        """Register a new facility"""
        
        # Check if facility with same name already exists
        existing_facility = db.query(Facility).filter(
            Facility.facility_name == facility_data.facility_name
        ).first()
        
        if existing_facility:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Facility with this name already exists"
            )
        
        # Create facility
        new_facility = Facility(
            facility_name=facility_data.facility_name,
            facility_type=facility_data.facility_type,
            address=facility_data.address,
            city=facility_data.city,
            phone_number=facility_data.phone_number,
            email=facility_data.email
        )
        
        db.add(new_facility)
        db.commit()
        db.refresh(new_facility)
        
        return new_facility
    
    @staticmethod
    def get_facility_by_id(db: Session, facility_id: int) -> Facility:
        """Get facility by ID"""
        facility = db.query(Facility).filter(
            Facility.facility_id == facility_id
        ).first()
        
        if not facility:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Facility not found"
            )
        
        return facility
    
    @staticmethod
    def get_all_facilities(
        db: Session, 
        facility_type: Optional[str] = None,
        city: Optional[str] = None
    ) -> List[Facility]:
        """Get all facilities with optional filters"""
        query = db.query(Facility)
        
        # Filter by type if provided
        if facility_type:
            query = query.filter(Facility.facility_type == facility_type)
        
        # Filter by city if provided
        if city:
            query = query.filter(Facility.city == city)
        
        facilities = query.order_by(Facility.facility_name).all()
        return facilities