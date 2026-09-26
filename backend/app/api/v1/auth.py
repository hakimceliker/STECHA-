"""Authentication endpoints"""
import logging
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt

from app.core.config import settings
from app.db.session import get_db
from app.db.base import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    locale: str = "tr"

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    locale: str
    is_admin: bool

    model_config = {"from_attributes": True}

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: int, expires_delta: Optional[timedelta] = None):
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)

    to_encode = {"sub": str(user_id), "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user

@router.post("/register", response_model=TokenResponse)
async def register(req: UserRegisterRequest, db: Session = Depends(get_db)):
    logger.info("User registration attempt for email: %s", req.email)
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        logger.warning("Registration failed - email already exists: %s", req.email)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        name=req.name,
        locale=req.locale,
        created_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    logger.info("User registered successfully - user_id: %d, email: %s", user.id, req.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user).model_dump()
    }

@router.post("/login", response_model=TokenResponse)
async def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    logger.info("Login attempt for email: %s", req.email)
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        logger.warning("Login failed - invalid credentials for email: %s", req.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    token = create_access_token(user.id)
    logger.info("User logged in successfully - user_id: %d, email: %s", user.id, req.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user).model_dump()
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.delete("/me", status_code=204)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user account (KVKK compliant - soft delete with data anonymization)"""
    logger.warning("User account deletion initiated - user_id: %d, email: %s", current_user.id, current_user.email)
    current_user.is_deleted = True
    current_user.deleted_at = datetime.utcnow()
    # Anonymize personal data per KVKK
    current_user.email = f"deleted_{current_user.id}@deleted.local"
    current_user.name = "Deleted User"
    db.commit()
    logger.info("User account deleted successfully - user_id: %d", current_user.id)
    return None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
async def change_password(
    req: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    logger.info("Password change attempt - user_id: %d", current_user.id)
    if not verify_password(req.current_password, current_user.password_hash):
        logger.warning("Password change failed - incorrect current password for user_id: %d", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )

    if len(req.new_password) < 8:
        logger.warning("Password change failed - new password too short for user_id: %d", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )

    current_user.password_hash = hash_password(req.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()

    logger.info("Password changed successfully - user_id: %d", current_user.id)
    return {"message": "Password changed successfully"}
