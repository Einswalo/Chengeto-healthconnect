from sqlalchemy.orm import Session
from app.models.healthcare_provider import HealthcareProvider
from app.models.user import User
from app.models.facility import Facility
from app.schemas.healthcare_provider import HealthcareProviderCreate
from app.schemas.auth import UserRegister
from app.core.security import get_password_hash
from typing import List, Optional

class HealthcareProviderService:
    
    @staticmethod
    def create_provider(db: Session, user_data: UserRegister, provider_data: HealthcareProviderCreate) -> HealthcareProvider:
        """Create a new healthcare provider with user account"""
        
        # Create user account first
        hashed_password = get_password_hash(user_data.password)
        user = User(
            email=user_data.email,
            password_hash=hashed_password,
            user_type=user_data.user_type,
            is_active=True
        )
        db.add(user)
        db.flush()  # Get user_id without committing
        
        # Create provider profile
        provider = HealthcareProvider(
            user_id=user.user_id,
            first_name=provider_data.first_name,
            last_name=provider_data.last_name,
            provider_type=provider_data.provider_type,
            specialization=provider_data.specialization,
            license_number=provider_data.license_number,
            phone_number=provider_data.phone_number,
            facility_id=provider_data.facility_id  # Link to facility
        )
        db.add(provider)
        db.commit()
        db.refresh(provider)
        
        return provider
    
    @staticmethod
    def get_provider_by_user_id(db: Session, user_id: int) -> Optional[HealthcareProvider]:
        return db.query(HealthcareProvider).filter(HealthcareProvider.user_id == user_id).first()
    
    @staticmethod
    def get_provider_by_id(db: Session, provider_id: int) -> Optional[HealthcareProvider]:
        return db.query(HealthcareProvider).filter(HealthcareProvider.provider_id == provider_id).first()
    
    @staticmethod
    def get_all_providers(db: Session, provider_type: str = None, skip: int = 0, limit: int = 50) -> List[HealthcareProvider]:
        query = db.query(HealthcareProvider)
        if provider_type:
            query = query.filter(HealthcareProvider.provider_type == provider_type)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_providers_by_facility(db: Session, facility_id: int) -> List[HealthcareProvider]:
        """Get all providers at a specific facility"""
        return db.query(HealthcareProvider).filter(HealthcareProvider.facility_id == facility_id).all()