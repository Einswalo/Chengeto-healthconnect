from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime

# Appointment Creation
class AppointmentCreate(BaseModel):
    patient_id: int
    provider_id: Optional[int] = None
    facility_id: Optional[int] = None
    appointment_date: str  # Format: "YYYY-MM-DD"
    appointment_time: str  # Format: "HH:MM"
    reason: Optional[str] = None
    notes: Optional[str] = None

# Appointment Update
class AppointmentUpdate(BaseModel):
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    status: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None

# Appointment Response
class AppointmentResponse(BaseModel):
    appointment_id: int
    patient_id: int
    provider_id: Optional[int]
    facility_id: Optional[int]
    appointment_date: date
    appointment_time: time
    status: str
    reason: Optional[str]
    notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True