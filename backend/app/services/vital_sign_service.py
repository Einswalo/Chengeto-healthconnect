from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.vital_sign import VitalSign
from app.schemas.vital_sign import VitalSignCreate
from typing import List

class VitalSignService:
    
    @staticmethod
    def create_vital_sign(db: Session, vital_data: VitalSignCreate) -> VitalSign:
        """Record vital signs for a patient"""
        
        # Create vital sign record
        new_vital = VitalSign(
            patient_id=vital_data.patient_id,
            record_id=vital_data.record_id,
            temperature=vital_data.temperature,
            blood_pressure_systolic=vital_data.blood_pressure_systolic,
            blood_pressure_diastolic=vital_data.blood_pressure_diastolic,
            heart_rate=vital_data.heart_rate,
            respiratory_rate=vital_data.respiratory_rate,
            weight=vital_data.weight,
            height=vital_data.height
        )
        
        db.add(new_vital)
        db.commit()
        db.refresh(new_vital)
        
        return new_vital
    
    @staticmethod
    def get_vital_sign_by_id(db: Session, vital_id: int) -> VitalSign:
        """Get vital sign by ID"""
        vital = db.query(VitalSign).filter(
            VitalSign.vital_id == vital_id
        ).first()
        
        if not vital:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vital sign record not found"
            )
        
        return vital
    
    @staticmethod
    def get_patient_vital_signs(db: Session, patient_id: int) -> List[VitalSign]:
        """Get all vital signs for a patient"""
        vitals = db.query(VitalSign).filter(
            VitalSign.patient_id == patient_id
        ).order_by(VitalSign.recorded_at.desc()).all()
        
        return vitals