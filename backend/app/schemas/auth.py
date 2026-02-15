from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime

# User Registration
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    user_type: str
    
    @validator('user_type')
    def validate_user_type(cls, v):
        allowed_types = ['patient', 'doctor', 'nurse', 'admin', 'pharmacist', 'receptionist']
        if v not in allowed_types:
            raise ValueError(f'user_type must be one of {allowed_types}')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

# User Login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Token Response
class Token(BaseModel):
    access_token: str
    token_type: str

# Token Data
class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    user_type: Optional[str] = None

# User Response
class UserResponse(BaseModel):
    user_id: int
    email: str
    user_type: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
        