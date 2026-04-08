from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.prescription import Prescription
from app.schemas.prescription import PrescriptionCreate
from datetime import datetime
from typing import List
import secrets
from app.services.blockchain_service import BlockchainService, Block
from app.models.blockchain import BlockchainBlock
import json

class PrescriptionService:
    
    @staticmethod
    def create_prescription(db: Session, prescription_data: PrescriptionCreate) -> Prescription:
        """Create a new prescription with blockchain verification"""
        
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
            is_dispensed=False
        )
        
        db.add(new_prescription)
        db.commit()
        db.refresh(new_prescription)
        
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
            
            # Create prescription block
            prescription_block = BlockchainService.create_prescription_block(
                new_prescription, previous_hash, new_index
            )
            
            # Generate blockchain token (readable format)
            new_prescription.blockchain_token = f"RX-{prescription_block.hash[:16].upper()}"
            new_prescription.blockchain_token = prescription_block.hash
            
            # Save block to blockchain
            blockchain_record = BlockchainBlock(
                block_index=prescription_block.index,
                block_hash=prescription_block.hash,
                previous_hash=prescription_block.previous_hash,
                timestamp=prescription_block.timestamp,
                block_type="prescription",
                record_id=new_prescription.prescription_id,
                data=json.dumps(prescription_block.data)
            )
            
            db.add(blockchain_record)
            db.commit()
            db.refresh(new_prescription)
            
        except Exception as e:
            print(f"Blockchain error: {e}")
            new_prescription.blockchain_token = f"RX-{secrets.token_hex(16)}"
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