from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, Token
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from datetime import timedelta
from app.core.config import settings


class AuthService:

    @staticmethod
    def register_user(db: Session, user_data: UserRegister) -> User:
        """Register a new user"""
        existing_user = db.query(User).filter(
            User.email == user_data.email
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            user_type=user_data.user_type,
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def authenticate_user(db: Session, login_data: UserLogin) -> Token:
        """Authenticate user and return JWT token"""
        user = db.query(User).filter(
            User.email == login_data.email
        ).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user account"
            )
        access_token_expires = timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        # ✅ STANDARDIZED payload — use both sub and user_id
        access_token = create_access_token(
            data={
                "sub": str(user.user_id),
                "user_id": user.user_id,
                "email": user.email,
                "user_type": user.user_type
            },
            expires_delta=access_token_expires
        )
        return Token(
            access_token=access_token,
            token_type="bearer"
        )

    @staticmethod
    def get_current_user(db: Session, token: str) -> User:
        """
        Get current user from JWT token.
        Handles both payload formats:
        - {user_id: 1, ...}  (web login)
        - {sub: "1", ...}    (patient login)
        """
        payload = decode_access_token(token)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # ✅ Check both 'user_id' and 'sub' fields
        user_id = payload.get("user_id")
        if not user_id:
            sub = payload.get("sub")
            if sub:
                try:
                    user_id = int(sub)
                except (ValueError, TypeError):
                    user_id = None

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = db.query(User).filter(
            User.user_id == user_id
        ).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        return user
