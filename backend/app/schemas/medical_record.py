from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

# Medical Record Creation
class MedicalRecordCreate(BaseModel):
    patient_id: int
    provider_id: Optional[int] = None
    facility_id: Optional[int] = None
    visit_date: str  # Format: "YYYY-MM-DD"
    diagnosis: Optional[str] = None
    symptoms: Optional[str] = None
    treatment_plan: Optional[str] = None
    notes: Optional[str] = None


class MedicalRecordUpdate(BaseModel):
    visit_date: Optional[str] = None  # Format: "YYYY-MM-DD"
    diagnosis: Optional[str] = None
    symptoms: Optional[str] = None
    treatment_plan: Optional[str] = None
    notes: Optional[str] = None

# Medical Record Response
class MedicalRecordResponse(BaseModel):
    record_id: int
    patient_id: int
    provider_id: Optional[int]
    facility_id: Optional[int]
    visit_date: date
    diagnosis: Optional[str]
    symptoms: Optional[str]
    treatment_plan: Optional[str]
    notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True