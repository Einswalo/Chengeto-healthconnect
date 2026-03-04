from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.ai_prediction import AIPrediction
from app.schemas.ai_prediction import AIPredictionCreate
from typing import Optional
import ollama

class AIService:
    
    @staticmethod
    def predict_disease(db: Session, prediction_data: AIPredictionCreate) -> AIPrediction:
        """
        Predict disease using AI based on symptoms and vital signs
        
        Focus areas:
        - Malaria (endemic in Zimbabwe)
        - Typhoid
        - Tuberculosis
        - Pneumonia
        """
        
        # Build prompt for AI
        prompt = AIService._build_diagnostic_prompt(
            symptoms=prediction_data.symptoms,
            vital_signs=prediction_data.vital_signs,
            location=prediction_data.patient_location
        )
        
        # Call Ollama AI
        try:
            ai_response = AIService._call_ollama(prompt)
            predicted_condition, confidence = AIService._parse_ai_response(ai_response)
        except Exception as e:
            # If AI fails, still create record but mark as error
            predicted_condition = "AI Analysis Failed"
            confidence = 0.0
        
        # Save prediction to database
        new_prediction = AIPrediction(
            patient_id=prediction_data.patient_id,
            record_id=prediction_data.record_id,
            symptoms=prediction_data.symptoms,
            predicted_condition=predicted_condition,
            confidence_score=confidence,
            ai_model_version="llama3"
        )
        
        db.add(new_prediction)
        db.commit()
        db.refresh(new_prediction)
        
        return new_prediction
    
    @staticmethod
    def _build_diagnostic_prompt(
        symptoms: str, 
        vital_signs: Optional[dict] = None,
        location: Optional[str] = None
    ) -> str:
        """Build a detailed prompt for the AI"""
        
        prompt = f"""You are a medical AI assistant helping doctors in Zimbabwe.

PATIENT SYMPTOMS:
{symptoms}
"""
        
        # Add vital signs if provided
        if vital_signs:
            prompt += f"\nVITAL SIGNS:\n"
            if vital_signs.get('temperature'):
                prompt += f"- Temperature: {vital_signs['temperature']}°C\n"
            if vital_signs.get('heart_rate'):
                prompt += f"- Heart Rate: {vital_signs['heart_rate']} bpm\n"
            if vital_signs.get('blood_pressure_systolic'):
                prompt += f"- Blood Pressure: {vital_signs['blood_pressure_systolic']}/{vital_signs['blood_pressure_diastolic']} mmHg\n"
            if vital_signs.get('respiratory_rate'):
                prompt += f"- Respiratory Rate: {vital_signs['respiratory_rate']} breaths/min\n"
        
        # Add location context
        if location:
            prompt += f"\nPATIENT LOCATION: {location}\n"
            if location.lower() in ['kariba', 'zambezi valley', 'victoria falls', 'mutare']:
                prompt += "(Note: This is a malaria-endemic area in Zimbabwe)\n"
        
        prompt += """
TASK: Based on the symptoms and vital signs, predict the most likely disease.

Focus on common diseases in Zimbabwe:
1. Malaria (especially in endemic areas)
2. Typhoid fever
3. Tuberculosis
4. Pneumonia
5. HIV-related infections

Provide your response in this EXACT format:
DIAGNOSIS: [Disease name]
CONFIDENCE: [Number between 0-100]%
REASONING: [Brief explanation in 2-3 sentences]

Example:
DIAGNOSIS: Malaria
CONFIDENCE: 85%
REASONING: High fever, chills, and location in endemic area strongly suggest malaria. The fever pattern and associated symptoms are classic presentations. Recommend RDT test for confirmation.
"""
        
        return prompt
    
    @staticmethod
    def _call_ollama(prompt: str) -> str:
        """Call Ollama AI and get response"""
        try:
            response = ollama.chat(
                model='llama3',
                messages=[
                    {
                        'role': 'system',
                        'content': 'You are a medical AI assistant. Provide accurate, evidence-based medical assessments.'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ]
            )
            
            return response['message']['content']
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI service error: {str(e)}. Make sure Ollama is running."
            )
    
    @staticmethod
    def _parse_ai_response(ai_response: str) -> tuple[str, float]:
        """
        Parse AI response to extract diagnosis and confidence
        
        Returns: (diagnosis, confidence_score)
        """
        diagnosis = "Unknown"
        confidence = 0.0
        
        try:
            # Extract diagnosis
            if "DIAGNOSIS:" in ai_response:
                diagnosis_line = [line for line in ai_response.split('\n') if 'DIAGNOSIS:' in line][0]
                diagnosis = diagnosis_line.split('DIAGNOSIS:')[1].strip()
            
            # Extract confidence
            if "CONFIDENCE:" in ai_response:
                confidence_line = [line for line in ai_response.split('\n') if 'CONFIDENCE:' in line][0]
                confidence_str = confidence_line.split('CONFIDENCE:')[1].strip()
                # Remove % sign and convert to float
                confidence = float(confidence_str.replace('%', '').strip())
        
        except Exception as e:
            # If parsing fails, return defaults
            diagnosis = "AI Analysis Completed (See full response)"
            confidence = 50.0
        
        return diagnosis, confidence
    
    @staticmethod
    def get_prediction_by_id(db: Session, prediction_id: int) -> AIPrediction:
        """Get AI prediction by ID"""
        prediction = db.query(AIPrediction).filter(
            AIPrediction.prediction_id == prediction_id
        ).first()
        
        if not prediction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="AI prediction not found"
            )
        
        return prediction
    
    @staticmethod
    def get_patient_predictions(db: Session, patient_id: int):
        """Get all AI predictions for a patient"""
        predictions = db.query(AIPrediction).filter(
            AIPrediction.patient_id == patient_id
        ).order_by(AIPrediction.prediction_date.desc()).all()
        
        return predictions