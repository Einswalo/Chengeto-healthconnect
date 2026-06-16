from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from app.db.database import get_db
from app.api.auth import get_current_user

from app.models.user import User
from app.models.healthcare_provider import HealthcareProvider
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord
from app.models.prescription import Prescription

router = APIRouter(
    prefix="/doctor-dashboard",
    tags=["Doctor Dashboard"]
)


class DoctorDashboardResponse(BaseModel):
    provider_id: int
    doctor_name: str

    total_patients: int
    total_appointments: int
    total_records: int
    total_prescriptions: int

    recent_appointments: list

    class Config:
        from_attributes = True


@router.get("/")
async def get_doctor_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.user_type.lower() != "doctor":
        raise HTTPException(
            status_code=403,
            detail="Only doctors can access this dashboard"
        )

    provider = (
        db.query(HealthcareProvider)
        .filter(
            HealthcareProvider.user_id == current_user.user_id
        )
        .first()
    )

    if not provider:
        raise HTTPException(
            status_code=404,
            detail="No provider profile found for this user"
        )

    total_patients = db.query(Patient).count()

    total_appointments = (
        db.query(Appointment)
        .filter(
            Appointment.provider_id == provider.provider_id
        )
        .count()
    )

    total_records = (
        db.query(MedicalRecord)
        .filter(
            MedicalRecord.provider_id == provider.provider_id
        )
        .count()
    )

    total_prescriptions = (
        db.query(Prescription)
        .filter(
            Prescription.provider_id == provider.provider_id
        )
        .count()
    )

    recent_appointments = (
        db.query(Appointment)
        .filter(
            Appointment.provider_id == provider.provider_id
        )
        .order_by(Appointment.appointment_date.desc())
        .limit(10)
        .all()
    )

    return {
        "provider_id": provider.provider_id,
        "doctor_name": f"{provider.first_name} {provider.last_name}",
        "total_patients": total_patients,
        "total_appointments": total_appointments,
        "total_records": total_records,
        "total_prescriptions": total_prescriptions,
        "recent_appointments": recent_appointments
    }