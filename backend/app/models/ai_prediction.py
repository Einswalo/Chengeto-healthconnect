from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class AIPrediction(Base):
    __tablename__ = "ai_predictions"
    
    prediction_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"))
    record_id = Column(Integer, ForeignKey("medical_records.record_id", ondelete="CASCADE"), nullable=True)
    symptoms = Column(Text, nullable=False)
    predicted_condition = Column(String(200))
    confidence_score = Column(Numeric(5, 2))  # e.g., 85.50
    ai_model_version = Column(String(50))
    prediction_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    patient = relationship("Patient", backref="ai_predictions")
    medical_record = relationship("MedicalRecord", backref="ai_predictions")