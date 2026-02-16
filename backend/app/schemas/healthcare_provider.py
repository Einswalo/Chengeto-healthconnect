from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Healthcare Provider Registration
class HealthcareProviderCreate(BaseModel):
    first_name: str
    last_name: str
    provider_type: str  # Doctor, Nurse, Specialist
    specialization: Optional[str] = None
    license_number: str
    phone_number: Optional[str] = None

# Healthcare Provider Response
class HealthcareProviderResponse(BaseModel):
    provider_id: int
    user_id: int
    first_name: str
    last_name: str
    provider_type: str
    specialization: Optional[str]
    license_number: str
    phone_number: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True