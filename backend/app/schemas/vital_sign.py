from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

# Vital Sign Creation
class VitalSignCreate(BaseModel):
    patient_id: int
    record_id: Optional[int] = None
    temperature: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    respiratory_rate: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None

# Vital Sign Response
class VitalSignResponse(BaseModel):
    vital_id: int
    patient_id: int
    record_id: Optional[int]
    temperature: Optional[float]
    blood_pressure_systolic: Optional[int]
    blood_pressure_diastolic: Optional[int]
    heart_rate: Optional[int]
    respiratory_rate: Optional[int]
    weight: Optional[float]
    height: Optional[float]
    recorded_at: datetime
    
    class Config:
        from_attributes = True