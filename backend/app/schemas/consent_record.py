from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

# Consent Record Creation
class ConsentRecordCreate(BaseModel):
    patient_id: int
    provider_id: int
    facility_id: Optional[int] = None
    consent_given: bool = True
    consent_type: str  # Full Access, Limited Access, Emergency Only
    valid_from: str  # Format: "YYYY-MM-DD"
    valid_until: Optional[str] = None  # Format: "YYYY-MM-DD" or None for permanent

# Consent Record Response
class ConsentRecordResponse(BaseModel):
    consent_id: int
    patient_id: int
    provider_id: int
    facility_id: Optional[int]
    consent_given: bool
    consent_type: str
    valid_from: date
    valid_until: Optional[date]
    blockchain_hash: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True