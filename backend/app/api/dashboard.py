from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.db.database import get_db

from app.schemas.medical_record import MedicalRecordResponse
from app.schemas.prescription import PrescriptionResponse
from app.schemas.appointment import AppointmentResponse
from app.schemas.ai_prediction import AIPredictionResponse
from app.schemas.patient import PatientResponse

from app.services.patient_service import PatientService
from app.services.medical_record_service import MedicalRecordService
from app.services.prescription_service import PrescriptionService
from app.services.appointment_service import AppointmentService
from app.services.ai_service import AIService

from app.models.user import User
from app.api.auth import get_current_user   # IMPORTANT: use ONLY THIS

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class PatientDashboard(BaseModel):
    profile: PatientResponse
    medical_records: List[MedicalRecordResponse]
    prescriptions: List[PrescriptionResponse]
    appointments: List[AppointmentResponse]
    ai_predictions: List[AIPredictionResponse]

    class Config:
        from_attributes = True


@router.get("/", response_model=PatientDashboard)
async def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # DEBUG (TEMP)
    print("USER TYPE:", current_user.user_type)

    if not current_user.user_type:
        raise HTTPException(
            status_code=403,
            detail="User type missing"
        )

    if current_user.user_type.lower() != "patient":
        raise HTTPException(
            status_code=403,
            detail=f"Access denied for role: {current_user.user_type}"
        )

    patient = PatientService.get_patient_by_user_id(db, current_user.user_id)

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    patient_id = patient.patient_id

    return {
        "profile": patient,
        "medical_records": MedicalRecordService.get_patient_medical_records(db, patient_id),
        "prescriptions": PrescriptionService.get_patient_prescriptions(db, patient_id),
        "appointments": AppointmentService.get_patient_appointments(db, patient_id),
        "ai_predictions": AIService.get_patient_predictions(db, patient_id),
    }