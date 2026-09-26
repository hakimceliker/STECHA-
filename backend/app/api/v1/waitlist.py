"""Waitlist endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from typing import Optional, List
import re

from app.db.session import get_db
from app.db.base import WaitlistEntry
from app.api.v1.auth import get_current_user

router = APIRouter(tags=["waitlist"])


class WaitlistEntryCreate(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    name: str
    source: str = "landing_page"
    campaign_source: Optional[str] = None
    consent_marketing: bool = False
    consent_terms: bool = False

    @validator('phone')
    def validate_phone(cls, v):
        if v and not re.match(r'^\+?1?\d{9,15}$', v.replace(' ', '').replace('-', '')):
            raise ValueError('Invalid phone number format')
        return v

    @validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        return v.strip()


class WaitlistEntryUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class WaitlistEntryResponse(BaseModel):
    id: int
    email: str
    phone: Optional[str]
    name: str
    source: str
    campaign_source: Optional[str]
    consent_marketing: bool
    consent_terms: bool
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.post("/waitlist", response_model=WaitlistEntryResponse, status_code=status.HTTP_201_CREATED)
def create_waitlist_entry(
    entry: WaitlistEntryCreate,
    db: Session = Depends(get_db)
):
    """Create a new waitlist entry with validation and duplicate prevention"""
    # Check for duplicate email
    existing = db.query(WaitlistEntry).filter(
        WaitlistEntry.email == entry.email.lower()
    ).first()

    if existing:
        if existing.status == "active":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered on waitlist"
            )
        # Reactivate inactive entries
        existing.status = "active"
        existing.phone = entry.phone or existing.phone
        existing.consent_marketing = entry.consent_marketing or existing.consent_marketing
        existing.consent_terms = entry.consent_terms or existing.consent_terms
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing

    try:
        db_entry = WaitlistEntry(
            email=entry.email.lower(),
            phone=entry.phone,
            name=entry.name,
            source=entry.source,
            campaign_source=entry.campaign_source,
            consent_marketing=entry.consent_marketing,
            consent_terms=entry.consent_terms,
            status="active"
        )
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered on waitlist"
        )


@router.get("/waitlist/{entry_id}", response_model=WaitlistEntryResponse)
def get_waitlist_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific waitlist entry (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    entry = db.query(WaitlistEntry).filter(WaitlistEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waitlist entry not found"
        )
    return entry


@router.get("/waitlist", response_model=List[WaitlistEntryResponse])
def list_waitlist_entries(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List waitlist entries (admin only) with filtering"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    query = db.query(WaitlistEntry)

    if status:
        query = query.filter(WaitlistEntry.status == status)

    entries = query.order_by(WaitlistEntry.created_at.desc()).offset(skip).limit(limit).all()
    return entries


@router.patch("/waitlist/{entry_id}", response_model=WaitlistEntryResponse)
def update_waitlist_entry(
    entry_id: int,
    update: WaitlistEntryUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a waitlist entry (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    entry = db.query(WaitlistEntry).filter(WaitlistEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waitlist entry not found"
        )

    if update.status:
        entry.status = update.status
    if update.notes is not None:
        entry.notes = update.notes

    entry.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)
    return entry
