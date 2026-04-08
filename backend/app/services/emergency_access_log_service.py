from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.emergency_access_log import EmergencyAccessLog
from app.schemas.emergency_access_log import EmergencyAccessLogCreate
from typing import List
import secrets
from app.services.blockchain_service import BlockchainService, Block
from app.models.blockchain import BlockchainBlock
import json

class EmergencyAccessLogService:
    
    @staticmethod
    def create_emergency_access(
        db: Session, 
        log_data: EmergencyAccessLogCreate
    ) -> EmergencyAccessLog:
        """Create an emergency access log with blockchain audit trail"""
        
        # Create emergency access log
        new_log = EmergencyAccessLog(
            patient_id=log_data.patient_id,
            provider_id=log_data.provider_id,
            facility_id=log_data.facility_id,
            access_reason=log_data.access_reason,
            is_approved=True  # Auto-approve for emergency
        )
        
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        
        # Add to blockchain
        try:
            # Get the last block
            last_block = db.query(BlockchainBlock).order_by(
                BlockchainBlock.block_index.desc()
            ).first()
            
            if last_block:
                previous_hash = last_block.block_hash
                new_index = last_block.block_index + 1
            else:
                # Create genesis block
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
            
            # Create emergency access block
            emergency_block = BlockchainService.create_emergency_access_block(
                new_log, previous_hash, new_index
            )
            
            # Store blockchain hash
            new_log.blockchain_hash = emergency_block.hash
            
            # Save block to blockchain
            blockchain_record = BlockchainBlock(
                block_index=emergency_block.index,
                block_hash=emergency_block.hash,
                previous_hash=emergency_block.previous_hash,
                timestamp=emergency_block.timestamp,
                block_type="emergency_access",
                record_id=new_log.log_id,
                data=json.dumps(emergency_block.data)
            )
            
            db.add(blockchain_record)
            db.commit()
            db.refresh(new_log)
            
        except Exception as e:
            print(f"Blockchain error: {e}")
            new_log.blockchain_hash = f"EMERGENCY-{secrets.token_hex(16)}"
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