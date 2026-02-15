from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class Facility(Base):
    __tablename__ = "facilities"
    
    facility_id = Column(Integer, primary_key=True, index=True)
    facility_name = Column(String(200), nullable=False)
    facility_type = Column(String(50))
    address = Column(Text)
    city = Column(String(100))
    phone_number = Column(String(20))
    email = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())