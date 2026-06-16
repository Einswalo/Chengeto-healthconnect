from sqlalchemy.orm import Session
from app.models.facility import Facility
from app.schemas.facility import FacilityCreate
from typing import List, Optional

class FacilityService:
    
    @staticmethod
    def create_facility(db: Session, facility_data: FacilityCreate) -> Facility:
        facility = Facility(
            facility_name=facility_data.facility_name,
            facility_type=facility_data.facility_type,
            address=facility_data.address,
            city=facility_data.city,
            phone_number=facility_data.phone_number,
            email=facility_data.email,
        )
        db.add(facility)
        db.commit()
        db.refresh(facility)
        return facility
    
    @staticmethod
    def get_all_facilities(db: Session, facility_type: str = None, city: str = None) -> List[Facility]:
        query = db.query(Facility)
        if facility_type:
            query = query.filter(Facility.facility_type == facility_type)
        if city:
            query = query.filter(Facility.city == city)
        return query.all()
    
    @staticmethod
    def get_facility_by_id(db: Session, facility_id: int) -> Facility:
        return db.query(Facility).filter(Facility.facility_id == facility_id).first()