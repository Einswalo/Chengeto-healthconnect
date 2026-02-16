from sqlalchemy import Column, Integer, String, Text, Date, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Prescription(Base):
    __tablename__ = "prescriptions"
    
    prescription_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"))
    provider_id = Column(Integer, ForeignKey("healthcare_providers.provider_id", ondelete="SET NULL"), nullable=True)
    record_id = Column(Integer, ForeignKey("medical_records.record_id", ondelete="CASCADE"), nullable=True)
    medication_name = Column(String(200), nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    duration = Column(String(100))
    instructions = Column(Text)
    prescription_date = Column(Date, nullable=False)
    is_dispensed = Column(Boolean, default=False)
    blockchain_token = Column(String(255), unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", backref="prescriptions")