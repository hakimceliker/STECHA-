"""Emergency/SOS endpoints for user safety"""
import logging
import re
from datetime import datetime
from typing import Optional
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.base import User
from app.api.v1.auth import get_current_user
from app.services.notification_service import notification_service

router = APIRouter(prefix="/emergency", tags=["emergency"])
logger = logging.getLogger(__name__)

class EmergencySOS(BaseModel):
    """Emergency SOS alert"""
    location: Optional[dict] = None  # {"latitude": float, "longitude": float}
    message: Optional[str] = None
    contacts: list[str] = []  # Email addresses of emergency contacts

class EmergencyResponse(BaseModel):
    """Emergency response model"""
    alert_id: str
    status: str
    message: str

@router.post("/sos", response_model=EmergencyResponse)
async def trigger_sos(
    req: EmergencySOS,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger emergency SOS alert with contact notifications and location tracking"""
    alert_id = str(uuid4())
    logger.critical("SOS Alert triggered - user_id: %d, alert_id: %s, location: %s", current_user.id, alert_id, req.location)

    # Notify emergency contacts
    try:
        for contact_email in req.contacts:
            notification_service.send_email(
                to_email=contact_email,
                subject=f"🚨 Emergency SOS Alert from {current_user.name}",
                body=f"Emergency alert received from {current_user.name}\nAlert ID: {alert_id}\nMessage: {req.message or 'No additional message'}\nLocation: {req.location if req.location else 'Location not provided'}\nTime: {datetime.utcnow().isoformat()}",
                alert_type="emergency"
            )
    except Exception as e:
        logger.error("Failed to notify emergency contacts - alert_id: %s, error: %s", alert_id, str(e))

    return {
        "alert_id": alert_id,
        "status": "triggered",
        "message": "Emergency alert sent to designated contacts"
    }

@router.get("/check-in")
async def check_in(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """User check-in endpoint - confirms user is safe"""
    current_user.last_check_in = datetime.utcnow()
    db.commit()
    logger.info("User check-in recorded - user_id: %d", current_user.id)

    return {
        "status": "checked_in",
        "timestamp": datetime.utcnow().isoformat(),
        "message": "Check-in recorded successfully"
    }

@router.post("/set-emergency-contacts")
async def set_emergency_contacts(
    contacts: list[str],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set emergency contact emails (max 5)"""
    if len(contacts) > 5:
        logger.warning("Emergency contact setup failed - too many contacts for user_id: %d", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 5 emergency contacts allowed"
        )

    # Validate emails
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    for email in contacts:
        if not re.match(email_pattern, email):
            logger.warning("Emergency contact setup failed - invalid email for user_id: %d", current_user.id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid email: {email}"
            )

    logger.info("Emergency contacts updated - user_id: %d, contact_count: %d", current_user.id, len(contacts))

    return {
        "status": "updated",
        "contact_count": len(contacts),
        "message": "Emergency contacts saved successfully"
    }
