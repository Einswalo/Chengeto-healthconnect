from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from app.models.appointment import Appointment
from app.models.healthcare_provider import HealthcareProvider
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate
from datetime import date, time
from fastapi import HTTPException, status

class AppointmentService:
    
    @staticmethod
    def get_patient_appointments(db: Session, patient_id: int) -> List[Appointment]:
        """Get all appointments for a patient"""
        return db.query(Appointment).filter(
            Appointment.patient_id == patient_id
        ).order_by(Appointment.appointment_date.desc()).all()
    
    @staticmethod
    def get_provider_appointments(db: Session, provider_id: int, include_past: bool = True) -> List[Appointment]:
        """
        Get appointments for a specific provider.
        Includes all appointments where this provider is assigned.
        """
        query = db.query(Appointment).filter(Appointment.provider_id == provider_id)
        
        if not include_past:
            # Only show future appointments
            from datetime import date
            query = query.filter(Appointment.appointment_date >= date.today())
        
        return query.order_by(Appointment.appointment_date.desc()).all()
    
    @staticmethod
    def get_facility_appointments(db: Session, facility_id: int, provider_id: int = None) -> List[Appointment]:
        """
        Get appointments for a facility.
        Doctors can only see appointments at their assigned facility.
        If provider_id is provided, also filter by that provider.
        """
        query = db.query(Appointment).filter(Appointment.facility_id == facility_id)
        
        if provider_id:
            query = query.filter(
                or_(
                    Appointment.provider_id == provider_id,
                    Appointment.provider_id.is_(None)  # Also show unassigned appointments at the facility
                )
            )
        
        return query.order_by(Appointment.appointment_date.desc()).all()
    
    @staticmethod
    def get_doctor_dashboard_appointments(db: Session, doctor_provider_id: int, doctor_facility_id: int) -> dict:
        """
        Get appointments for doctor's dashboard.
        Returns:
        - Upcoming appointments at their facility
        - Past appointments history at their facility
        """
        from datetime import date
        today = date.today()
        
        # Get all appointments at the doctor's facility
        all_facility_appointments = db.query(Appointment).filter(
            Appointment.facility_id == doctor_facility_id
        ).order_by(Appointment.appointment_date.desc()).all()
        
        # Separate into upcoming and past
        upcoming = []
        past = []
        
        for apt in all_facility_appointments:
            if apt.appointment_date >= today and apt.status not in ["Cancelled", "cancelled"]:
                upcoming.append(apt)
            else:
                past.append(apt)
        
        # Also get appointments specifically assigned to this doctor
        my_assigned = db.query(Appointment).filter(
            and_(
                Appointment.provider_id == doctor_provider_id,
                Appointment.appointment_date >= today,
                Appointment.status.notin_(["Cancelled", "cancelled"])
            )
        ).all()
        
        return {
            "upcoming": upcoming,
            "past": past,
            "my_assigned": my_assigned
        }
    
    @staticmethod
    def get_appointment_by_id(db: Session, appointment_id: int) -> Optional[Appointment]:
        return db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
    
    @staticmethod
    def create_appointment(db: Session, appointment_data: AppointmentCreate) -> Appointment:
        """Create a new appointment"""
        # Convert string date and time to proper types if needed
        if isinstance(appointment_data.appointment_date, str):
            appointment_date = date.fromisoformat(appointment_data.appointment_date)
        else:
            appointment_date = appointment_data.appointment_date
            
        if isinstance(appointment_data.appointment_time, str):
            appointment_time = time.fromisoformat(appointment_data.appointment_time)
        else:
            appointment_time = appointment_data.appointment_time
        
        appointment = Appointment(
            patient_id=appointment_data.patient_id,
            provider_id=appointment_data.provider_id,
            facility_id=appointment_data.facility_id,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            reason=appointment_data.reason,
            notes=appointment_data.notes,
            status="Scheduled"
        )
        db.add(appointment)
        db.commit()
        db.refresh(appointment)
        return appointment
    
    @staticmethod
    def update_appointment(db: Session, appointment_id: int, update_data: AppointmentUpdate) -> Appointment:
        """Update an existing appointment"""
        appointment = AppointmentService.get_appointment_by_id(db, appointment_id)
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            if key == "appointment_date" and isinstance(value, str):
                value = date.fromisoformat(value)
            elif key == "appointment_time" and isinstance(value, str):
                value = time.fromisoformat(value)
            setattr(appointment, key, value)
        
        db.commit()
        db.refresh(appointment)
        return appointment
    
    @staticmethod
    def cancel_appointment(db: Session, appointment_id: int) -> Appointment:
        """Cancel an appointment"""
        appointment = AppointmentService.get_appointment_by_id(db, appointment_id)
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        appointment.status = "Cancelled"
        db.commit()
        db.refresh(appointment)
        return appointment