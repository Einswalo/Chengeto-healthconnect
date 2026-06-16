from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.medical_record import MedicalRecord
from app.models.vital_sign import VitalSign
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordUpdate
from datetime import datetime
from typing import List


class MedicalRecordService:

    @staticmethod
    def create_medical_record(db: Session, record_data: MedicalRecordCreate) -> MedicalRecord:
        """Create a new medical record"""
        try:
            visit_date = datetime.strptime(record_data.visit_date, "%Y-%m-%d").date()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid visit_date format (expected YYYY-MM-DD): {e}"
            )

        new_record = MedicalRecord(
            patient_id=record_data.patient_id,
            provider_id=record_data.provider_id,
            facility_id=record_data.facility_id,
            visit_date=visit_date,
            diagnosis=record_data.diagnosis,
            symptoms=record_data.symptoms,
            treatment_plan=record_data.treatment_plan,
            notes=record_data.notes,
        )

        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        # Eager load vitals (will be empty for new record)
        return MedicalRecordService._load_with_vitals(db, new_record.record_id)

    @staticmethod
    def get_medical_record_by_id(db: Session, record_id: int) -> MedicalRecord:
        """Get medical record by ID with vitals"""
        record = MedicalRecordService._load_with_vitals(db, record_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical record not found"
            )
        return record

    @staticmethod
    def get_patient_medical_records(db: Session, patient_id: int) -> List[MedicalRecord]:
        """Get all medical records for a patient with vitals embedded"""
        records = (
            db.query(MedicalRecord)
            .options(joinedload(MedicalRecord.vital_signs))
            .filter(MedicalRecord.patient_id == patient_id)
            .order_by(MedicalRecord.visit_date.desc())
            .all()
        )
        return records

    @staticmethod
    def update_medical_record(db: Session, record_id: int, update: MedicalRecordUpdate) -> MedicalRecord:
        """Update an existing medical record"""
        record = db.query(MedicalRecord).filter(MedicalRecord.record_id == record_id).first()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical record not found"
            )

        if update.visit_date:
            try:
                record.visit_date = datetime.strptime(update.visit_date, "%Y-%m-%d").date()
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid visit_date format")

        if update.diagnosis is not None: record.diagnosis = update.diagnosis
        if update.symptoms is not None: record.symptoms = update.symptoms
        if update.treatment_plan is not None: record.treatment_plan = update.treatment_plan
        if update.notes is not None: record.notes = update.notes

        db.commit()
        return MedicalRecordService._load_with_vitals(db, record_id)

    @staticmethod
    def _load_with_vitals(db: Session, record_id: int) -> MedicalRecord:
        """Load a record with its vitals eager-loaded"""
        return (
            db.query(MedicalRecord)
            .options(joinedload(MedicalRecord.vital_signs))
            .filter(MedicalRecord.record_id == record_id)
            .first()
        )