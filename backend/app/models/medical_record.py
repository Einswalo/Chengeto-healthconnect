from sqlalchemy import Column, Integer, Text, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class MedicalRecord(Base):
    __tablename__ = "medical_records"
    
    record_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"))
    provider_id = Column(Integer, ForeignKey("healthcare_providers.provider_id", ondelete="SET NULL"), nullable=True)
    facility_id = Column(Integer, ForeignKey("facilities.facility_id", ondelete="SET NULL"), nullable=True)
    visit_date = Column(Date, nullable=False)
    diagnosis = Column(Text)
    symptoms = Column(Text)
    treatment_plan = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", backref="medical_records")