from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

# Prescription Creation
class PrescriptionCreate(BaseModel):
    patient_id: int
    provider_id: Optional[int] = None
    record_id: Optional[int] = None
    medication_name: str
    dosage: str
    frequency: str
    duration: Optional[str] = None
    instructions: Optional[str] = None
    prescription_date: str  # Format: "YYYY-MM-DD"

# Prescription Response
class PrescriptionResponse(BaseModel):
    prescription_id: int
    patient_id: int
    provider_id: Optional[int]
    record_id: Optional[int]
    medication_name: str
    dosage: str
    frequency: str
    duration: Optional[str]
    instructions: Optional[str]
    prescription_date: date
    is_dispensed: bool
    blockchain_token: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True