from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Facility Creation
class FacilityCreate(BaseModel):
    facility_name: str
    facility_type: str
    address: Optional[str] = None
    city: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None

# Facility Response
class FacilityResponse(BaseModel):
    facility_id: int
    facility_name: str
    facility_type: str
    address: Optional[str] = None
    city: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True