import hashlib
import json
from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.consent_record import ConsentRecord
from app.models.prescription import Prescription
from app.models.emergency_access_log import EmergencyAccessLog
from app.models.medical_record import MedicalRecord
from app.models.ai_prediction import AIPrediction


class Block:
    """
    Represents a single block in the blockchain
    """
    def __init__(self, index: int, timestamp: str, data: Dict, previous_hash: str):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.hash = self.calculate_hash()
    
    def calculate_hash(self) -> str:
        """
        Calculate SHA-256 hash of the block
        """
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash
        }, sort_keys=True)
        
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def to_dict(self) -> Dict:
        """
        Convert block to dictionary
        """
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "hash": self.hash
        }


class BlockchainService:
    """
    Blockchain service for CHENGETO HealthConnect
    
    Implements a simple blockchain for:
    - Consent records (patient consent verification)
    - Prescriptions (medication verification)
    - Emergency access (audit trail)
    - Medical records (clinical notes / diagnosis)
    - AI predictions (clinical decision support trace)
    """
    
    @staticmethod
    def create_genesis_block() -> Block:
        """
        Create the first block in the blockchain (Genesis Block)
        """
        return Block(
            index=0,
            timestamp=datetime.utcnow().isoformat(),
            data={"type": "genesis", "message": "CHENGETO HealthConnect Blockchain Initialized"},
            previous_hash="0"
        )
    
    @staticmethod
    def create_consent_block(consent_record: ConsentRecord, previous_hash: str, index: int) -> Block:
        """
        Create a blockchain block for a consent record
        """
        data = {
            "type": "consent",
            "consent_id": consent_record.consent_id,
            "patient_id": consent_record.patient_id,
            "provider_id": consent_record.provider_id,
            "consent_type": consent_record.consent_type,
            "consent_given": consent_record.consent_given,
            "valid_from": str(consent_record.valid_from),
            "valid_until": str(consent_record.valid_until) if consent_record.valid_until else None,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return Block(
            index=index,
            timestamp=datetime.utcnow().isoformat(),
            data=data,
            previous_hash=previous_hash
        )
    
    @staticmethod
    def create_prescription_block(prescription: Prescription, previous_hash: str, index: int) -> Block:
        """
        Create a blockchain block for a prescription
        """
        data = {
            "type": "prescription",
            "prescription_id": prescription.prescription_id,
            "patient_id": prescription.patient_id,
            "provider_id": prescription.provider_id,
            "medication_name": prescription.medication_name,
            "dosage": prescription.dosage,
            "frequency": prescription.frequency,
            "prescription_date": str(prescription.prescription_date),
            "is_dispensed": prescription.is_dispensed,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return Block(
            index=index,
            timestamp=datetime.utcnow().isoformat(),
            data=data,
            previous_hash=previous_hash
        )
    
    @staticmethod
    def create_emergency_access_block(log: EmergencyAccessLog, previous_hash: str, index: int) -> Block:
        """
        Create a blockchain block for emergency access
        """
        data = {
            "type": "emergency_access",
            "log_id": log.log_id,
            "patient_id": log.patient_id,
            "provider_id": log.provider_id,
            "access_reason": log.access_reason,
            "access_time": str(log.access_time),
            "is_approved": log.is_approved,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return Block(
            index=index,
            timestamp=datetime.utcnow().isoformat(),
            data=data,
            previous_hash=previous_hash
        )

    @staticmethod
    def create_medical_record_block(record: MedicalRecord, previous_hash: str, index: int) -> Block:
        data = {
            "type": "medical_record",
            "record_id": record.record_id,
            "patient_id": record.patient_id,
            "provider_id": record.provider_id,
            "facility_id": record.facility_id,
            "visit_date": str(record.visit_date),
            "diagnosis": record.diagnosis,
            "timestamp": datetime.utcnow().isoformat()
        }
        return Block(
            index=index,
            timestamp=datetime.utcnow().isoformat(),
            data=data,
            previous_hash=previous_hash
        )

    @staticmethod
    def create_ai_prediction_block(pred: AIPrediction, previous_hash: str, index: int) -> Block:
        data = {
            "type": "ai_prediction",
            "prediction_id": pred.prediction_id,
            "patient_id": pred.patient_id,
            "record_id": pred.record_id,
            "predicted_condition": pred.predicted_condition,
            "confidence_score": float(pred.confidence_score) if pred.confidence_score is not None else None,
            "ai_model_version": pred.ai_model_version,
            "timestamp": datetime.utcnow().isoformat()
        }
        return Block(
            index=index,
            timestamp=datetime.utcnow().isoformat(),
            data=data,
            previous_hash=previous_hash
        )
    
    @staticmethod
    def verify_block(block: Block, previous_block: Block) -> bool:
        """
        Verify the integrity of a block
        
        Checks:
        1. Block hash is correct
        2. Previous hash matches
        3. Index is sequential
        """
        # Check if block hash is correct
        if block.hash != block.calculate_hash():
            return False
        
        # Check if previous hash matches
        if block.previous_hash != previous_block.hash:
            return False
        
        # Check if index is sequential
        if block.index != previous_block.index + 1:
            return False
        
        return True
    
    @staticmethod
    def verify_chain(blocks: List[Block]) -> bool:
        """
        Verify the entire blockchain
        """
        if len(blocks) == 0:
            return True
        
        # Check genesis block
        if blocks[0].previous_hash != "0":
            return False
        
        # Verify each subsequent block
        for i in range(1, len(blocks)):
            if not BlockchainService.verify_block(blocks[i], blocks[i-1]):
                return False
        
        return True
    
    @staticmethod
    def generate_blockchain_hash(record_type: str, record_id: int, data: Dict) -> str:
        """
        Generate a unique blockchain hash for a record
        
        This hash can be stored in the database and used to verify
        that the record matches what's on the blockchain
        """
        hash_string = json.dumps({
            "type": record_type,
            "id": record_id,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }, sort_keys=True)
        
        return hashlib.sha256(hash_string.encode()).hexdigest()