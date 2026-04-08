from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.consent_record import ConsentRecord
from app.models.emergency_access_log import EmergencyAccessLog
from app.models.patient import Patient
from app.models.user import User
from app.services.healthcare_provider_service import HealthcareProviderService


@dataclass(frozen=True)
class AccessContext:
    patient_id: int
    provider_id: Optional[int]
    via_consent: bool
    via_emergency: bool


def require_patient_access(
    db: Session,
    *,
    user: User,
    patient_id: int,
    allow_emergency: bool = True,
) -> AccessContext:
    """
    Enforce patient data access rules.
    
    Rules:
    - Patient can access own data.
    - Admin can access all data.
    - Doctor/nurse/pharmacist/receptionist require an active consent, OR an approved emergency access (time-bound).
    
    Notes:
    - Consent must be consent_given and within valid_from/valid_until.
    - Emergency access is considered valid for 2 hours from access_time.
    """
    # Patient self-access
    if user.user_type == "patient":
        patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
        if not patient or patient.user_id != user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own health data"
            )
        return AccessContext(patient_id=patient_id, provider_id=None, via_consent=False, via_emergency=False)

    # Admin access
    if user.user_type == "admin":
        return AccessContext(patient_id=patient_id, provider_id=None, via_consent=False, via_emergency=False)

    # Provider access (doctor/nurse/pharmacist/etc)
    provider = HealthcareProviderService.get_provider_by_user_id(db, user.user_id)
    provider_id = provider.provider_id

    today = date.today()

    # Active consent
    consent = (
        db.query(ConsentRecord)
        .filter(
            ConsentRecord.patient_id == patient_id,
            ConsentRecord.provider_id == provider_id,
            ConsentRecord.consent_given.is_(True),
            ConsentRecord.valid_from <= today,
        )
        .order_by(ConsentRecord.created_at.desc())
        .first()
    )
    if consent and (consent.valid_until is None or consent.valid_until >= today):
        return AccessContext(patient_id=patient_id, provider_id=provider_id, via_consent=True, via_emergency=False)

    # Emergency access window (2h)
    if allow_emergency:
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(hours=2)
        # access_time is stored in DB; compare in UTC (best effort)
        emergency_log = (
            db.query(EmergencyAccessLog)
            .filter(
                EmergencyAccessLog.patient_id == patient_id,
                EmergencyAccessLog.provider_id == provider_id,
                EmergencyAccessLog.is_approved.is_(True),
                EmergencyAccessLog.access_time >= window_start,
            )
            .order_by(EmergencyAccessLog.access_time.desc())
            .first()
        )
        if emergency_log:
            return AccessContext(patient_id=patient_id, provider_id=provider_id, via_consent=False, via_emergency=True)

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied: patient consent required (or emergency access)"
    )

