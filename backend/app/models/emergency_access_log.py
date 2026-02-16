from sqlalchemy import Column, Integer, Text, Boolean, DateTime, ForeignKey, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class EmergencyAccessLog(Base):
    __tablename__ = "emergency_access_logs"
    
    log_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"))
    provider_id = Column(Integer, ForeignKey("healthcare_providers.provider_id", ondelete="SET NULL"), nullable=True)
    facility_id = Column(Integer, ForeignKey("facilities.facility_id", ondelete="SET NULL"), nullable=True)
    access_reason = Column(Text, nullable=False)
    access_time = Column(DateTime(timezone=True), server_default=func.now())
    blockchain_hash = Column(String(255), unique=True)
    is_approved = Column(Boolean, default=False)
    
    # Relationships
    patient = relationship("Patient", backref="emergency_access_logs")