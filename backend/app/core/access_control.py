from dataclasses import dataclass
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.patient import Patient

from app.services.healthcare_provider_service import (
    HealthcareProviderService,
)


@dataclass
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
    TEMPORARY ACCESS CONTROL
    Allows doctors to access patients while testing
    """

    # =========================
    # PATIENT ACCESS
    # =========================

    if user.user_type == "patient":

        patient = (
            db.query(Patient)
            .filter(Patient.patient_id == patient_id)
            .first()
        )

        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )

        if patient.user_id != user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own records"
            )

        return AccessContext(
            patient_id=patient_id,
            provider_id=None,
            via_consent=False,
            via_emergency=False
        )

    # =========================
    # ADMIN ACCESS
    # =========================

    if user.user_type == "admin":

        return AccessContext(
            patient_id=patient_id,
            provider_id=None,
            via_consent=False,
            via_emergency=False
        )

    # =========================
    # DOCTOR / PROVIDER ACCESS
    # =========================

    if user.user_type in [
        "doctor",
        "nurse",
        "pharmacist",
        "receptionist"
    ]:

        try:

            provider = (
                HealthcareProviderService
                .get_provider_by_user_id(
                    db,
                    user.user_id
                )
            )

            provider_id = provider.provider_id

        except Exception:

            provider_id = None

        return AccessContext(
            patient_id=patient_id,
            provider_id=provider_id,
            via_consent=True,
            via_emergency=False
        )

    # =========================
    # DENY ACCESS
    # =========================

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied"
    )