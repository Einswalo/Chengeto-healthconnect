from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class VitalSign(Base):
    __tablename__ = "vital_signs"
    
    vital_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"))
    record_id = Column(Integer, ForeignKey("medical_records.record_id", ondelete="CASCADE"), nullable=True)
    temperature = Column(Numeric(4, 1))  # e.g., 37.5
    blood_pressure_systolic = Column(Integer)  # e.g., 120
    blood_pressure_diastolic = Column(Integer)  # e.g., 80
    heart_rate = Column(Integer)  # beats per minute
    respiratory_rate = Column(Integer)  # breaths per minute
    weight = Column(Numeric(5, 2))  # kg, e.g., 70.50
    height = Column(Numeric(5, 2))  # cm, e.g., 175.00
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    patient = relationship("Patient", backref="vital_signs")
    medical_record = relationship("MedicalRecord", backref="vital_signs")