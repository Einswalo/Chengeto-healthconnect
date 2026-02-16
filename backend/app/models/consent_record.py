from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class ConsentRecord(Base):
    __tablename__ = "consent_records"
    
    consent_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"))
    provider_id = Column(Integer, ForeignKey("healthcare_providers.provider_id", ondelete="CASCADE"))
    facility_id = Column(Integer, ForeignKey("facilities.facility_id", ondelete="SET NULL"), nullable=True)
    consent_given = Column(Boolean, default=True)
    consent_type = Column(String(50))  # Full Access, Limited Access, Emergency Only
    valid_from = Column(Date, nullable=False)
    valid_until = Column(Date, nullable=True)
    blockchain_hash = Column(String(255), unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", backref="consent_records")
    provider = relationship("HealthcareProvider", backref="consent_records")