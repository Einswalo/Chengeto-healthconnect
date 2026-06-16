from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.db.database import get_db
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.services.appointment_service import AppointmentService
from app.services.healthcare_provider_service import HealthcareProviderService
from app.models.user import User
from app.models.healthcare_provider import HealthcareProvider
from app.core.access_control import require_patient_access
from app.core.roles import CLINICAL_STAFF
from app.api.auth import get_current_user

router = APIRouter(prefix="/appointments", tags=["Appointments"])


# Get appointments for a patient
@router.get("/patient/{patient_id}", response_model=List[AppointmentResponse])
async def get_patient_appointments(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all appointments for a patient."""
    require_patient_access(db, user=current_user, patient_id=patient_id)
    appointments = AppointmentService.get_patient_appointments(db, patient_id)
    return appointments


# ✅ NEW: Get appointments for doctor's facility
@router.get("/doctor/facility", response_model=dict)
async def get_doctor_facility_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get appointments for the doctor's assigned facility.
    Doctors can only see appointments at their own facility.
    """
    if current_user.user_type not in ["doctor", "nurse"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and nurses can access this endpoint"
        )
    
    # Get doctor's provider profile
    provider = HealthcareProviderService.get_provider_by_user_id(db, current_user.user_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider profile not found"
        )
    
    if not provider.facility_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not assigned to any facility. Please contact administrator."
        )
    
    # Get appointments for this facility
    appointments = AppointmentService.get_facility_appointments(
        db, 
        facility_id=provider.facility_id,
        provider_id=provider.provider_id
    )
    
    # Get facility name
    from app.services.facility_service import FacilityService
    facility = FacilityService.get_facility_by_id(db, provider.facility_id)
    
    return {
        "facility_id": provider.facility_id,
        "facility_name": facility.facility_name if facility else "Unknown",
        "appointments": appointments,
        "total": len(appointments)
    }


# ✅ NEW: Get doctor's dashboard appointments (upcoming vs past)
@router.get("/doctor/dashboard", response_model=dict)
async def get_doctor_dashboard_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get organized appointments for doctor's dashboard.
    Shows upcoming appointments at their facility and appointment history.
    """
    if current_user.user_type != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can access this endpoint"
        )
    
    # Get doctor's provider profile
    provider = HealthcareProviderService.get_provider_by_user_id(db, current_user.user_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider profile not found"
        )
    
    if not provider.facility_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not assigned to any facility. Please contact administrator."
        )
    
    # Get organized appointments
    dashboard_data = AppointmentService.get_doctor_dashboard_appointments(
        db,
        doctor_provider_id=provider.provider_id,
        doctor_facility_id=provider.facility_id
    )
    
    # Get facility name
    from app.services.facility_service import FacilityService
    facility = FacilityService.get_facility_by_id(db, provider.facility_id)
    
    return {
        "facility_id": provider.facility_id,
        "facility_name": facility.facility_name if facility else "Unknown",
        "upcoming_appointments": dashboard_data["upcoming"],
        "past_appointments": dashboard_data["past"],
        "my_assigned_appointments": dashboard_data["my_assigned"],
        "upcoming_count": len(dashboard_data["upcoming"]),
        "past_count": len(dashboard_data["past"])
    }


# Get single appointment
@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single appointment by ID."""
    appointment = AppointmentService.get_appointment_by_id(db, appointment_id)
    require_patient_access(db, user=current_user, patient_id=appointment.patient_id)
    return appointment


# Create appointment
@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Book a new appointment.
    Patients can book for themselves.
    Staff can book on behalf of patients.
    """
    require_patient_access(db, user=current_user, patient_id=appointment_data.patient_id)
    appointment = AppointmentService.create_appointment(db, appointment_data)
    return appointment


# Update appointment
@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: int,
    appointment_data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an appointment."""
    existing = AppointmentService.get_appointment_by_id(db, appointment_id)
    require_patient_access(db, user=current_user, patient_id=existing.patient_id)
    appointment = AppointmentService.update_appointment(db, appointment_id, appointment_data)
    return appointment


# Cancel appointment
@router.delete("/{appointment_id}", response_model=AppointmentResponse)
async def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel an appointment."""
    existing = AppointmentService.get_appointment_by_id(db, appointment_id)
    require_patient_access(db, user=current_user, patient_id=existing.patient_id)
    appointment = AppointmentService.cancel_appointment(db, appointment_id)
    return appointment