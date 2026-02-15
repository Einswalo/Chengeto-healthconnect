from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

# Patient Registration (extends user registration)
class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    gender: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    national_id: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None

# Patient Response
class PatientResponse(BaseModel):
    patient_id: int
    user_id: int
    first_name: str
    last_name: str
    date_of_birth: date
    gender: Optional[str]
    phone_number: Optional[str]
    city: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
        