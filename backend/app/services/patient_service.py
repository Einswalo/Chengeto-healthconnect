from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import PatientCreate
from app.schemas.auth import UserRegister
from app.services.auth_service import AuthService
from typing import List, Optional

class PatientService:
    
    @staticmethod
    def create_patient(db: Session, user_data: UserRegister, patient_data: PatientCreate) -> Patient:
        """
        Create a new patient with user account
        
        Steps:
        1. Create user account (with authentication)
        2. Create patient profile linked to user
        """
        
        # Step 1: Create user account
        user = AuthService.register_user(db, user_data)
        
        # Step 2: Create patient profile
        new_patient = Patient(
            user_id=user.user_id,
            first_name=patient_data.first_name,
            last_name=patient_data.last_name,
            date_of_birth=patient_data.date_of_birth,
            gender=patient_data.gender,
            phone_number=patient_data.phone_number,
            address=patient_data.address,
            city=patient_data.city,
            national_id=patient_data.national_id,
            emergency_contact_name=patient_data.emergency_contact_name,
            emergency_contact_phone=patient_data.emergency_contact_phone,
            blood_type=patient_data.blood_type,
            allergies=patient_data.allergies,
            chronic_conditions=patient_data.chronic_conditions
        )
        
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
        
        return new_patient
    
    @staticmethod
    def get_patient_by_id(db: Session, patient_id: int) -> Patient:
        """Get patient by patient_id"""
        patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        return patient
    
    @staticmethod
    def get_patient_by_user_id(db: Session, user_id: int) -> Patient:
        """Get patient by user_id"""
        patient = db.query(Patient).filter(Patient.user_id == user_id).first()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient profile not found"
            )
        
        return patient
    
    @staticmethod
    def update_patient(db: Session, patient_id: int, patient_data: PatientCreate) -> Patient:
        """Update patient profile"""
        patient = PatientService.get_patient_by_id(db, patient_id)
        
        # Update fields
        patient.first_name = patient_data.first_name
        patient.last_name = patient_data.last_name
        patient.date_of_birth = patient_data.date_of_birth
        patient.gender = patient_data.gender
        patient.phone_number = patient_data.phone_number
        patient.address = patient_data.address
        patient.city = patient_data.city
        patient.national_id = patient_data.national_id
        patient.emergency_contact_name = patient_data.emergency_contact_name
        patient.emergency_contact_phone = patient_data.emergency_contact_phone
        patient.blood_type = patient_data.blood_type
        patient.allergies = patient_data.allergies
        patient.chronic_conditions = patient_data.chronic_conditions
        
        db.commit()
        db.refresh(patient)
        
        return patient
    
    @staticmethod
    def search_patients(
        db: Session,
        search_query: Optional[str] = None,
        city: Optional[str] = None,
        blood_type: Optional[str] = None,
        gender: Optional[str] = None,
        skip: int = 0,
        limit: int = 10
    ) -> tuple[List[Patient], int]:
        """
        Search and filter patients with pagination
        
        Returns: (list of patients, total count)
        """
        query = db.query(Patient)
        
        # Search by name, national ID, or phone
        if search_query:
            search_pattern = f"%{search_query}%"
            query = query.filter(
                (Patient.first_name.ilike(search_pattern)) |
                (Patient.last_name.ilike(search_pattern)) |
                (Patient.national_id.ilike(search_pattern)) |
                (Patient.phone_number.ilike(search_pattern))
            )
        
        # Filter by city
        if city:
            query = query.filter(Patient.city == city)
        
        # Filter by blood type
        if blood_type:
            query = query.filter(Patient.blood_type == blood_type)
        
        # Filter by gender
        if gender:
            query = query.filter(Patient.gender == gender)
        
        # Get total count before pagination
        total = query.count()
        
        # Apply pagination
        patients = query.offset(skip).limit(limit).all()
        
        return patients, total