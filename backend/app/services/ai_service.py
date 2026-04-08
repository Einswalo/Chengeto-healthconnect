from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.ai_prediction import AIPrediction
from app.schemas.ai_prediction import AIPredictionCreate
from typing import Optional
import secrets
import json
from app.services.blockchain_service import BlockchainService
from app.models.blockchain import BlockchainBlock

class AIService:
    
    @staticmethod
    def predict_disease(db: Session, prediction_data: AIPredictionCreate) -> AIPrediction:
        """
        Predict disease using rule-based AI
        """
        predicted_condition, confidence = AIService._rule_based_prediction(
            symptoms=prediction_data.symptoms.lower(),
            vital_signs=prediction_data.vital_signs,
            location=prediction_data.patient_location
        )
        
        new_prediction = AIPrediction(
            patient_id=prediction_data.patient_id,
            record_id=prediction_data.record_id,
            symptoms=prediction_data.symptoms,
            predicted_condition=predicted_condition,
            confidence_score=confidence,
            ai_model_version="rule-based-v1"
        )
        
        db.add(new_prediction)
        db.commit()
        db.refresh(new_prediction)

        # Add AI prediction to blockchain (best-effort)
        try:
            last_block = db.query(BlockchainBlock).order_by(
                BlockchainBlock.block_index.desc()
            ).first()

            if last_block:
                previous_hash = last_block.block_hash
                new_index = last_block.block_index + 1
            else:
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

            ai_block = BlockchainService.create_ai_prediction_block(new_prediction, previous_hash, new_index)
            new_prediction.blockchain_hash = ai_block.hash

            blockchain_record = BlockchainBlock(
                block_index=ai_block.index,
                block_hash=ai_block.hash,
                previous_hash=ai_block.previous_hash,
                timestamp=ai_block.timestamp,
                block_type="ai_prediction",
                record_id=new_prediction.prediction_id,
                data=json.dumps(ai_block.data)
            )
            db.add(blockchain_record)
            db.commit()
            db.refresh(new_prediction)
        except Exception as e:
            print(f"Blockchain error: {e}")
            new_prediction.blockchain_hash = f"AIPRED-{secrets.token_hex(8)}"
            db.commit()
            db.refresh(new_prediction)
        
        return new_prediction
    
    @staticmethod
    def _rule_based_prediction(
        symptoms: str,
        vital_signs: Optional[dict] = None,
        location: Optional[str] = None
    ) -> tuple[str, float]:
        """Rule-based disease prediction"""
        
        temperature = None
        if vital_signs and 'temperature' in vital_signs:
            temperature = vital_signs['temperature']
        
        high_temp = temperature and temperature >= 38.0
        very_high_temp = temperature and temperature >= 39.0
        
        # MALARIA DETECTION
        malaria_score = 0
        if high_temp or 'fever' in symptoms:
            malaria_score += 25
        if very_high_temp or '39' in symptoms or '40' in symptoms:
            malaria_score += 15
        if 'chills' in symptoms or 'shivering' in symptoms:
            malaria_score += 20
        if 'sweating' in symptoms or 'sweat' in symptoms:
            malaria_score += 15
        if 'headache' in symptoms:
            malaria_score += 10
        if 'muscle' in symptoms and 'ache' in symptoms:
            malaria_score += 10
        if 'nausea' in symptoms or 'vomiting' in symptoms:
            malaria_score += 10
        
        if location:
            location_lower = location.lower()
            endemic_areas = ['kariba', 'zambezi', 'victoria falls', 'mutare']
            if any(area in location_lower for area in endemic_areas):
                malaria_score += 20
        
        # TYPHOID DETECTION
        typhoid_score = 0
        if 'fever' in symptoms or high_temp:
            typhoid_score += 20
        if 'abdominal' in symptoms or 'stomach' in symptoms:
            typhoid_score += 25
        if 'diarrhea' in symptoms or 'diarrhoea' in symptoms:
            typhoid_score += 20
        
        # TUBERCULOSIS DETECTION
        tb_score = 0
        if 'cough' in symptoms:
            tb_score += 30
        if 'night sweat' in symptoms:
            tb_score += 25
        if 'weight loss' in symptoms:
            tb_score += 20
        
        # PNEUMONIA DETECTION
        pneumonia_score = 0
        if 'cough' in symptoms:
            pneumonia_score += 25
        if 'chest pain' in symptoms:
            pneumonia_score += 20
        if 'breathing' in symptoms:
            pneumonia_score += 30
        
        scores = {
            'Malaria': malaria_score,
            'Typhoid Fever': typhoid_score,
            'Tuberculosis (TB)': tb_score,
            'Pneumonia': pneumonia_score
        }
        
        diagnosis = max(scores, key=scores.get)
        confidence = scores[diagnosis]
        
        if confidence < 30:
            diagnosis = "General Infection - Further Testing Required"
            confidence = 50.0
        
        confidence = min(confidence, 95.0)
        
        return diagnosis, confidence