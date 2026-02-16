from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.healthcare_provider import HealthcareProvider
from app.models.user import User
from app.schemas.healthcare_provider import HealthcareProviderCreate
from app.schemas.auth import UserRegister
from app.services.auth_service import AuthService

class HealthcareProviderService:
    
    @staticmethod
    def create_provider(
        db: Session, 
        user_data: UserRegister, 
        provider_data: HealthcareProviderCreate
    ) -> HealthcareProvider:
        """
        Create a new healthcare provider with user account
        
        Steps:
        1. Create user account (with authentication)
        2. Create provider profile linked to user
        """
        
        # Step 1: Create user account
        user = AuthService.register_user(db, user_data)
        
        # Step 2: Create provider profile
        new_provider = HealthcareProvider(
            user_id=user.user_id,
            first_name=provider_data.first_name,
            last_name=provider_data.last_name,
            provider_type=provider_data.provider_type,
            specialization=provider_data.specialization,
            license_number=provider_data.license_number,
            phone_number=provider_data.phone_number
        )
        
        db.add(new_provider)
        db.commit()
        db.refresh(new_provider)
        
        return new_provider
    
    @staticmethod
    def get_provider_by_id(db: Session, provider_id: int) -> HealthcareProvider:
        """Get provider by provider_id"""
        provider = db.query(HealthcareProvider).filter(
            HealthcareProvider.provider_id == provider_id
        ).first()
        
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Healthcare provider not found"
            )
        
        return provider
    
    @staticmethod
    def get_provider_by_user_id(db: Session, user_id: int) -> HealthcareProvider:
        """Get provider by user_id"""
        provider = db.query(HealthcareProvider).filter(
            HealthcareProvider.user_id == user_id
        ).first()
        
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Healthcare provider profile not found"
            )
        
        return provider