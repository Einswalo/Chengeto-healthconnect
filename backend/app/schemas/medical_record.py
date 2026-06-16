from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class VitalSignInRecord(BaseModel):
    """Vitals embedded inside a medical record response"""
    vital_id: int
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
    visit_date: Optional[str] = None
    diagnosis: Optional[str] = None
    symptoms: Optional[str] = None
    treatment_plan: Optional[str] = None
    notes: Optional[str] = None


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
    # ✅ Vitals embedded in the record response
    vital_signs: List[VitalSignInRecord] = []

    class Config:
        from_attributes = True