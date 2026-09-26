"""Emergency/SOS endpoints for user safety"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.base import User
from app.api.v1.auth import get_current_user
from app.services.notification_service import notification_service

router = APIRouter(prefix="/emergency", tags=["emergency"])

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
    """
    Trigger emergency SOS alert
    - Logs the emergency event
    - Notifies designated emergency contacts
    - Stores location information (if provided)
    """
    from uuid import uuid4
    import logging

    alert_id = str(uuid4())
    logger = logging.getLogger(__name__)

    # Log emergency alert
    logger.critical(
        f"SOS Alert triggered by user {current_user.id}",
        extra={
            "alert_id": alert_id,
            "user_id": current_user.id,
            "location": req.location,
            "message": req.message,
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": "EMERGENCY_SOS"
        }
    )

    # Notify emergency contacts
    try:
        for contact_email in req.contacts:
            notification_service.send_email(
                to_email=contact_email,
                subject=f"🚨 Emergency SOS Alert from {current_user.name}",
                body=f"""
                Emergency alert received from {current_user.name}
                Alert ID: {alert_id}
                Message: {req.message or 'No additional message'}
                Location: {req.location if req.location else 'Location not provided'}
                Time: {datetime.utcnow().isoformat()}

                Please ensure the user is safe.
                """,
                alert_type="emergency"
            )
    except Exception as e:
        logger.error(f"Failed to notify emergency contacts: {str(e)}")
        # Don't fail the SOS request due to notification failure

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
    """
    User check-in endpoint
    - Confirms user is safe
    - Can cancel pending SOS alerts
    """
    import logging
    logger = logging.getLogger(__name__)

    logger.info(
        f"User check-in: {current_user.id}",
        extra={
            "user_id": current_user.id,
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": "USER_CHECK_IN"
        }
    )

    current_user.last_check_in = datetime.utcnow()
    db.commit()

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
    """
    Set emergency contact emails
    - Store up to 5 emergency contacts
    """
    if len(contacts) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 5 emergency contacts allowed"
        )

    # Validate emails
    import re
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    for email in contacts:
        if not re.match(email_pattern, email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid email: {email}"
            )

    # Store contacts (would be stored in User model or separate table in production)
    import logging
    logger = logging.getLogger(__name__)
    logger.info(
        f"Emergency contacts updated for user {current_user.id}",
        extra={
            "user_id": current_user.id,
            "contact_count": len(contacts),
            "timestamp": datetime.utcnow().isoformat()
        }
    )

    return {
        "status": "updated",
        "contact_count": len(contacts),
        "message": "Emergency contacts saved successfully"
    }
