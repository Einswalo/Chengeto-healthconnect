from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.services.appointment_service import AppointmentService
from app.services.auth_service import AuthService
from app.core.access_control import require_patient_access

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_data: AppointmentCreate,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Book a new appointment
    
    Requires: JWT token
    
    - **patient_id**: Patient's ID
    - **appointment_date**: Format "YYYY-MM-DD"
    - **appointment_time**: Format "HH:MM" (24-hour)
    - **reason**: Reason for visit
    """
    # Verify user is authenticated
    user = AuthService.get_current_user(db, token)
    
    appointment = AppointmentService.create_appointment(db, appointment_data)
    return appointment

@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get appointment by ID
    
    Requires: JWT token
    """
    user = AuthService.get_current_user(db, token)
    appointment = AppointmentService.get_appointment_by_id(db, appointment_id)
    return appointment

@router.get("/patient/{patient_id}", response_model=List[AppointmentResponse])
async def get_patient_appointments(
    patient_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get all appointments for a patient
    
    Requires: JWT token
    """
    user = AuthService.get_current_user(db, token)
    require_patient_access(db, user=user, patient_id=patient_id)
    appointments = AppointmentService.get_patient_appointments(db, patient_id)
    return appointments

@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: int,
    appointment_data: AppointmentUpdate,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Update appointment
    
    Requires: JWT token
    """
    user = AuthService.get_current_user(db, token)
    appointment = AppointmentService.update_appointment(db, appointment_id, appointment_data)
    return appointment

@router.delete("/{appointment_id}", response_model=AppointmentResponse)
async def cancel_appointment(
    appointment_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Cancel appointment
    
    Requires: JWT token
    """
    user = AuthService.get_current_user(db, token)
    appointment = AppointmentService.cancel_appointment(db, appointment_id)
    return appointment