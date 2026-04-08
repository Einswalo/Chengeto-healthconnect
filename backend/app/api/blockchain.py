from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.blockchain import BlockchainBlock
from app.services.blockchain_service import BlockchainService, Block
from app.services.auth_service import AuthService
import json

router = APIRouter(prefix="/blockchain", tags=["Blockchain Verification"])

@router.get("/verify")
async def verify_blockchain(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Verify the integrity of the entire blockchain
    
    Requires: JWT token (any authenticated user)
    
    Checks:
    - All blocks have valid hashes
    - Chain is properly linked (each block references previous)
    - No tampering detected
    
    Returns blockchain status and statistics
    """
    user = AuthService.get_current_user(db, token)
    
    # Get all blocks
    blockchain_records = db.query(BlockchainBlock).order_by(
        BlockchainBlock.block_index
    ).all()
    
    if len(blockchain_records) == 0:
        return {
            "status": "empty",
            "message": "Blockchain is empty - no blocks created yet",
            "total_blocks": 0
        }
    
    # Convert to Block objects
    blocks = []
    for record in blockchain_records:
        data = json.loads(record.data)
        block = Block(
            index=record.block_index,
            timestamp=record.timestamp,
            data=data,
            previous_hash=record.previous_hash
        )
        # Verify the stored hash matches calculated hash
        if block.hash != record.block_hash:
            return {
                "status": "corrupted",
                "message": f"Block {record.block_index} has invalid hash!",
                "corrupted_block": record.block_index,
                "total_blocks": len(blockchain_records)
            }
        blocks.append(block)
    
    # Verify the entire chain
    is_valid = BlockchainService.verify_chain(blocks)
    
    # Get statistics
    block_types = {}
    for record in blockchain_records:
        block_type = record.block_type
        block_types[block_type] = block_types.get(block_type, 0) + 1
    
    return {
        "status": "valid" if is_valid else "invalid",
        "message": "Blockchain is valid and secure! ✅" if is_valid else "Blockchain integrity compromised! ⚠️",
        "total_blocks": len(blockchain_records),
        "block_distribution": block_types,
        "genesis_block": blockchain_records[0].block_hash if blockchain_records else None,
        "latest_block": blockchain_records[-1].block_hash if blockchain_records else None,
        "chain_valid": is_valid
    }

@router.get("/blocks")
async def get_all_blocks(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get all blocks in the blockchain
    
    Requires: JWT token (any authenticated user)
    
    Returns complete blockchain with all blocks
    """
    user = AuthService.get_current_user(db, token)
    
    blockchain_records = db.query(BlockchainBlock).order_by(
        BlockchainBlock.block_index
    ).all()
    
    blocks = []
    for record in blockchain_records:
        blocks.append({
            "block_index": record.block_index,
            "block_hash": record.block_hash,
            "previous_hash": record.previous_hash,
            "timestamp": record.timestamp,
            "block_type": record.block_type,
            "record_id": record.record_id,
            "data": json.loads(record.data),
            "created_at": str(record.created_at)
        })
    
    return {
        "total_blocks": len(blocks),
        "blocks": blocks
    }

@router.get("/block/{block_index}")
async def get_block_by_index(
    block_index: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get specific block by index
    
    Requires: JWT token (any authenticated user)
    """
    user = AuthService.get_current_user(db, token)
    
    block = db.query(BlockchainBlock).filter(
        BlockchainBlock.block_index == block_index
    ).first()
    
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Block {block_index} not found"
        )
    
    return {
        "block_index": block.block_index,
        "block_hash": block.block_hash,
        "previous_hash": block.previous_hash,
        "timestamp": block.timestamp,
        "block_type": block.block_type,
        "record_id": block.record_id,
        "data": json.loads(block.data),
        "created_at": str(block.created_at)
    }

@router.get("/verify/{record_type}/{record_id}")
async def verify_record(
    record_type: str,
    record_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Verify a specific record exists on the blockchain
    
    record_type: consent, prescription, or emergency_access
    record_id: ID of the record
    
    Returns blockchain verification proof
    """
    user = AuthService.get_current_user(db, token)
    
    # Find the block
    block = db.query(BlockchainBlock).filter(
        BlockchainBlock.block_type == record_type,
        BlockchainBlock.record_id == record_id
    ).first()
    
    if not block:
        return {
            "found": False,
            "message": f"{record_type} record {record_id} not found on blockchain"
        }
    
    # Verify the block's hash
    data = json.loads(block.data)
    verified_block = Block(
        index=block.block_index,
        timestamp=block.timestamp,)