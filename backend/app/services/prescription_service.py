from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.prescription import Prescription
from app.schemas.prescription import PrescriptionCreate
from datetime import datetime
from typing import List
import secrets

class PrescriptionService:
    
    @staticmethod
    def create_prescription(db: Session, prescription_data: PrescriptionCreate) -> Prescription:
        """Create a new prescription"""
        
        # Convert string date to date object
        try:
            prescription_date = datetime.strptime(prescription_data.prescription_date, "%Y-%m-%d").date()
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date format: {str(e)}"
            )
        
        # Generate blockchain token (placeholder - will be replaced with actual blockchain integration)
        blockchain_token = f"RX-{secrets.token_hex(16)}"
        
        # Create prescription
        new_prescription = Prescription(
            patient_id=prescription_data.patient_id,
            provider_id=prescription_data.provider_id,
            record_id=prescription_data.record_id,
            medication_name=prescription_data.medication_name,
            dosage=prescription_data.dosage,
            frequency=prescription_data.frequency,
            duration=prescription_data.duration,
            instructions=prescription_data.instructions,
            prescription_date=prescription_date,
            is_dispensed=False,
            blockchain_token=blockchain_token
        )
        
        db.add(new_prescription)
        db.commit()
        db.refresh(new_prescription)
        
        return new_prescription
    
    @staticmethod
    def get_prescription_by_id(db: Session, prescription_id: int) -> Prescription:
        """Get prescription by ID"""
        prescription = db.query(Prescription).filter(
            Prescription.prescription_id == prescription_id
        ).first()
        
        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found"
            )
        
        return prescription
    
    @staticmethod
    def get_patient_prescriptions(db: Session, patient_id: int) -> List[Prescription]:
        """Get all prescriptions for a patient"""
        prescriptions = db.query(Prescription).filter(
            Prescription.patient_id == patient_id
        ).order_by(Prescription.prescription_date.desc()).all()
        
        return prescriptions
    
    @staticmethod
    def mark_as_dispensed(db: Session, prescription_id: int) -> Prescription:
        """Mark prescription as dispensed"""
        prescription = PrescriptionService.get_prescription_by_id(db, prescription_id)
        
        if prescription.is_dispensed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Prescription already dispensed"
            )
        
        prescription.is_dispensed = True
        db.commit()
        db.refresh(prescription)
        
        return prescription