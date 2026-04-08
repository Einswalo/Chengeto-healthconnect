from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class BlockchainBlock(Base):
    __tablename__ = "blockchain_blocks"
    
    block_id = Column(Integer, primary_key=True, index=True)
    block_index = Column(Integer, unique=True, nullable=False)
    block_hash = Column(String(255), unique=True, nullable=False)
    previous_hash = Column(String(255), nullable=False)
    timestamp = Column(String(100), nullable=False)
    block_type = Column(String(50), nullable=False)  # consent, prescription, emergency_access
    record_id = Column(Integer, nullable=False)  # ID of the associated record
    data = Column(Text, nullable=False)  # JSON data of the block
    created_at = Column(DateTime(timezone=True), server_default=func.now())