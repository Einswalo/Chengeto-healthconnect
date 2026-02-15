from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate
from datetime import datetime, date, time
from typing import List, Optional

class AppointmentService:
    
    @staticmethod
    def create_appointment(db: Session, appointment_data: AppointmentCreate) -> Appointment:
        """Create a new appointment"""
        
        # Convert string dates to date/time objects
        try:
            appt_date = datetime.strptime(appointment_data.appointment_date, "%Y-%m-%d").date()
            appt_time = datetime.strptime(appointment_data.appointment_time, "%H:%M").time()
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date/time format: {str(e)}"
            )
        
        # Create appointment
        new_appointment = Appointment(
            patient_id=appointment_data.patient_id,
            provider_id=appointment_data.provider_id,
            facility_id=appointment_data.facility_id,
            appointment_date=appt_date,
            appointment_time=appt_time,
            status="Scheduled",
            reason=appointment_data.reason,
            notes=appointment_data.notes
        )
        
        db.add(new_appointment)
        db.commit()
        db.refresh(new_appointment)
        
        return new_appointment
    
    @staticmethod
    def get_appointment_by_id(db: Session, appointment_id: int) -> Appointment:
        """Get appointment by ID"""
        appointment = db.query(Appointment).filter(
            Appointment.appointment_id == appointment_id
        ).first()
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        return appointment
    
    @staticmethod
    def get_patient_appointments(db: Session, patient_id: int) -> List[Appointment]:
        """Get all appointments for a patient"""
        appointments = db.query(Appointment).filter(
            Appointment.patient_id == patient_id
        ).order_by(Appointment.appointment_date.desc()).all()
        
        return appointments
    
    @staticmethod
    def update_appointment(
        db: Session, 
        appointment_id: int, 
        appointment_data: AppointmentUpdate
    ) -> Appointment:
        """Update appointment"""
        appointment = AppointmentService.get_appointment_by_id(db, appointment_id)
        
        # Update fields if provided
        if appointment_data.appointment_date:
            appointment.appointment_date = datetime.strptime(
                appointment_data.appointment_date, "%Y-%m-%d"
            ).date()
        
        if appointment_data.appointment_time:
            appointment.appointment_time = datetime.strptime(
                appointment_data.appointment_time, "%H:%M"
            ).time()
        
        if appointment_data.status:
            appointment.status = appointment_data.status
        
        if appointment_data.reason:
            appointment.reason = appointment_data.reason
        
        if appointment_data.notes:
            appointment.notes = appointment_data.notes
        
        db.commit()
        db.refresh(appointment)
        
        return appointment
    
    @staticmethod
    def cancel_appointment(db: Session, appointment_id: int) -> Appointment:
        """Cancel appointment"""
        appointment = AppointmentService.get_appointment_by_id(db, appointment_id)
        appointment.status = "Cancelled"
        
        db.commit()
        db.refresh(appointment)
        
        return appointment