from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.consent_record import ConsentRecord
from app.schemas.consent_record import ConsentRecordCreate
from datetime import datetime
from typing import List
import secrets
from app.services.blockchain_service import BlockchainService, Block
from app.models.blockchain import BlockchainBlock
import json


class ConsentRecordService:
    
    @staticmethod
    def create_consent(db: Session, consent_data: ConsentRecordCreate) -> ConsentRecord:
        """Create a new consent record with blockchain verification"""
        
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
        
        # Create consent record
        new_consent = ConsentRecord(
            patient_id=consent_data.patient_id,
            provider_id=consent_data.provider_id,
            facility_id=consent_data.facility_id,
            consent_given=consent_data.consent_given,
            consent_type=consent_data.consent_type,
            valid_from=valid_from,
            valid_until=valid_until
        )
        
        db.add(new_consent)
        db.commit()
        db.refresh(new_consent)
        
        # Add to blockchain
        try:
            # Get the last block in the blockchain
            last_block = db.query(BlockchainBlock).order_by(
                BlockchainBlock.block_index.desc()
            ).first()
            
            if last_block:
                previous_hash = last_block.block_hash
                new_index = last_block.block_index + 1
            else:
                # Create genesis block first
                genesis = BlockchainService.create_genesis_block()
                genesis_record = BlockchainBlock(
                    block_index=genesis.index,
                    block_hash=genesis.hash,
                    previous_hash=genesis.previous_hash,
                    timestamp=genesis.timestamp,
                    block_type="genesis",
                    record_id=0,
                    data=json.dumps(genesis.data)
                )
                db.add(genesis_record)
                db.commit()
                
                previous_hash = genesis.hash
                new_index = 1
            
            # Create consent block
            consent_block = BlockchainService.create_consent_block(
                new_consent, previous_hash, new_index
            )
            
            # Store blockchain hash in consent record
            new_consent.blockchain_hash = consent_block.hash
            
            # Save block to blockchain table
            blockchain_record = BlockchainBlock(
                block_index=consent_block.index,
                block_hash=consent_block.hash,
                previous_hash=consent_block.previous_hash,
                timestamp=consent_block.timestamp,
                block_type="consent",
                record_id=new_consent.consent_id,
                data=json.dumps(consent_block.data)
            )
            
            db.add(blockchain_record)
            db.commit()
            db.refresh(new_consent)
            
        except Exception as e:
            # If blockchain fails, still keep the consent record
            print(f"Blockchain error: {e}")
            new_consent.blockchain_hash = f"BLOCKCHAIN-ERROR-{secrets.token_hex(8)}"
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