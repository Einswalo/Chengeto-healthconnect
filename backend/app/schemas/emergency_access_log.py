from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Emergency Access Log Creation
class EmergencyAccessLogCreate(BaseModel):
    patient_id: int
    provider_id: Optional[int] = None
    facility_id: Optional[int] = None
    access_reason: str

# Emergency Access Log Response
class EmergencyAccessLogResponse(BaseModel):
    log_id: int
    patient_id: int
    provider_id: Optional[int]
    facility_id: Optional[int]
    access_reason: str
    access_time: datetime
    blockchain_hash: Optional[str]
    is_approved: bool
    
    class Config:
        from_attributes = True