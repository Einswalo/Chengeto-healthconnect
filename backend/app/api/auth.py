from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user
    
    - **email**: Valid email address
    - **password**: Minimum 8 characters
    - **user_type**: patient, doctor, nurse, admin, pharmacist, or receptionist
    """
    user = AuthService.register_user(db, user_data)
    return user

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login and get access token
    
    - **email**: Registered email address
    - **password**: User password
    
    Returns JWT access token for authentication
    """
    token = AuthService.authenticate_user(db, login_data)
    return token

@router.get("/me", response_model=UserResponse)
async def get_current_user(token: str, db: Session = Depends(get_db)):
    """
    Get current authenticated user
    
    - **token**: JWT access token
    """
    user = AuthService.get_current_user(db, token)
    return user