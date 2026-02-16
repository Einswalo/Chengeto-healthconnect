from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.consent_record import ConsentRecord
from app.schemas.consent_record import ConsentRecordCreate
from datetime import datetime
from typing import List
import secrets

class ConsentRecordService:
    
    @staticmethod
    def create_consent(db: Session, consent_data: ConsentRecordCreate) -> ConsentRecord:
        """Create a new consent record"""
        
        # Convert string dates to date objects
        try:
            valid_from = datetime.strptime(consent_data.valid_from, "%Y-%m-%d").date()
            valid_until = None
            if consent_data.valid_until:
                valid_until = datetime.strptime(consent_data.valid_until, "%Y-%m-%d").date()
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date format: {str(e)}"
            )
        
        # Generate blockchain hash (placeholder)
        blockchain_hash = f"CONSENT-{secrets.token_hex(16)}"
        
        # Create consent record
        new_consent = ConsentRecord(
            patient_id=consent_data.patient_id,
            provider_id=consent_data.provider_id,
            facility_id=consent_data.facility_id,
            consent_given=consent_data.consent_given,
            consent_type=consent_data.consent_type,
            valid_from=valid_from,
            valid_until=valid_until,
            blockchain_hash=blockchain_hash
        )
        
        db.add(new_consent)
        db.commit()
        db.refresh(new_consent)
        
        return new_consent
    
    @staticmethod
    def get_consent_by_id(db: Session, consent_id: int) -> ConsentRecord:
        """Get consent record by ID"""
        consent = db.query(ConsentRecord).filter(
            ConsentRecord.consent_id == consent_id
        ).first()
        
        if not consent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consent record not found"
            )
        
        return consent
    
    @staticmethod
    def get_patient_consents(db: Session, patient_id: int) -> List[ConsentRecord]:
        """Get all consent records for a patient"""
        consents = db.query(ConsentRecord).filter(
            ConsentRecord.patient_id == patient_id
        ).order_by(ConsentRecord.created_at.desc()).all()
        
        return consents
    
    @staticmethod
    def revoke_consent(db: Session, consent_id: int) -> ConsentRecord:
        """Revoke consent"""
        consent = ConsentRecordService.get_consent_by_id(db, consent_id)
        
        consent.consent_given = False
        db.commit()
        db.refresh(consent)
        
        return consent