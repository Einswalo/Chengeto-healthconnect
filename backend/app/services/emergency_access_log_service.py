from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.emergency_access_log import EmergencyAccessLog
from app.schemas.emergency_access_log import EmergencyAccessLogCreate
from typing import List
import secrets

class EmergencyAccessLogService:
    
    @staticmethod
    def create_emergency_access(
        db: Session, 
        log_data: EmergencyAccessLogCreate
    ) -> EmergencyAccessLog:
        """Create an emergency access log"""
        
        # Generate blockchain hash (placeholder)
        blockchain_hash = f"EMERGENCY-{secrets.token_hex(16)}"
        
        # Create emergency access log
        new_log = EmergencyAccessLog(
            patient_id=log_data.patient_id,
            provider_id=log_data.provider_id,
            facility_id=log_data.facility_id,
            access_reason=log_data.access_reason,
            blockchain_hash=blockchain_hash,
            is_approved=True  # Auto-approve for emergency
        )
        
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        
        return new_log
    
    @staticmethod
    def get_emergency_access_by_id(db: Session, log_id: int) -> EmergencyAccessLog:
        """Get emergency access log by ID"""
        log = db.query(EmergencyAccessLog).filter(
            EmergencyAccessLog.log_id == log_id
        ).first()
        
        if not log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Emergency access log not found"
            )
        
        return log
    
    @staticmethod
    def get_patient_emergency_access_logs(
        db: Session, 
        patient_id: int
    ) -> List[EmergencyAccessLog]:
        """Get all emergency access logs for a patient"""
        logs = db.query(EmergencyAccessLog).filter(
            EmergencyAccessLog.patient_id == patient_id
        ).order_by(EmergencyAccessLog.access_time.desc()).all()
        
        return logs