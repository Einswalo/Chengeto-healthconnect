from __future__ import annotations

from enum import Enum
from typing import Iterable


class Role(str, Enum):
    patient = "patient"
    doctor = "doctor"
    nurse = "nurse"
    pharmacist = "pharmacist"
    receptionist = "receptionist"
    admin = "admin"


PROVIDERS: set[str] = {"doctor", "nurse"}
CLINICAL_STAFF: set[str] = {"doctor", "nurse", "admin"}
DISPENSERS: set[str] = {"pharmacist", "admin"}
ADMIN_ONLY: set[str] = {"admin"}


def require_role(user_type: str, allowed: Iterable[str]) -> None:
    if user_type not in set(allowed):
        raise PermissionError()

