from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.services.appointment_service import AppointmentService
from app.models.user import User
from app.core.access_control import require_patient_access
from app.api.auth import get_current_user

router = APIRouter(prefix="/appointments", tags=["Appointments"])


# ✅ /patient/{patient_id} MUST come before /{appointment_id}
@router.get("/patient/{patient_id}", response_model=List[AppointmentResponse])
async def get_patient_appointments(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all appointments for a patient.

    - Patients can view their own appointments
    - Providers need consent/emergency access
    """
    require_patient_access(db, user=current_user, patient_id=patient_id)
    appointments = AppointmentService.get_patient_appointments(db, patient_id)
    return appointments


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a single appointment by ID.
    """
    appointment = AppointmentService.get_appointment_by_id(db, appointment_id)
    require_patient_access(db, user=current_user, patient_id=appointment.patient_id)
    return appointment


@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Book a new appointment.

    - Patients can book appointments for themselves only
    - Doctors/nurses/admins can book on behalf of a patient (with consent)

    Required fields:
    - **patient_id**: Patient's ID
    - **appointment_date**: Format "YYYY-MM-DD"
    - **appointment_time**: Format "HH:MM" (24-hour)
    - **reason**: Reason for visit
    """
    require_patient_access(db, user=current_user, patient_id=appointment_data.patient_id)
    appointment = AppointmentService.create_appointment(db, appointment_data)
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: int,
    appointment_data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an appointment (reschedule, change reason, etc.)

    - Patients can update their own appointments
    - Providers need consent/emergency access
    """
    existing = AppointmentService.get_appointment_by_id(db, appointment_id)
    require_patient_access(db, user=current_user, patient_id=existing.patient_id)
    appointment = AppointmentService.update_appointment(db, appointment_id, appointment_data)
    return appointment


@router.delete("/{appointment_id}", response_model=AppointmentResponse)
async def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cancel an appointment.

    - Patients can cancel their own appointments
    - Providers need consent/emergency access
    """
    existing = AppointmentService.get_appointment_by_id(db, appointment_id)
    require_patient_access(db, user=current_user, patient_id=existing.patient_id)
    appointment = AppointmentService.cancel_appointment(db, appointment_id)
    return appointment
