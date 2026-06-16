from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_user
from app.models.patient import Patient
from app.models.user import User
from app.core.security import verify_password, create_access_token
from app.core.config import settings
from datetime import timedelta

# Import PatientLogin safely
try:
    from app.schemas.patient_auth import PatientLogin
    HAS_PATIENT_LOGIN = True
except ImportError:
    HAS_PATIENT_LOGIN = False

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    return AuthService.register_user(db, user_data)


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    return AuthService.authenticate_user(db, login_data)


@router.post("/patient-login", response_model=Token)
async def patient_login(login_data: dict, db: Session = Depends(get_db)):
    """Patient login via email + password (same as regular login)"""
    from app.schemas.auth import UserLogin
    user_login = UserLogin(
        email=login_data.get("email", ""),
        password=login_data.get("password", "")
    )
    return AuthService.authenticate_user(db, user_login)


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "user_type": current_user.user_type,
        "role": current_user.user_type,
        "is_active": current_user.is_active,
    }