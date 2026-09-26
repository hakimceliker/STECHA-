"""Reservations endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.db.base import User, Reservation, Business

router = APIRouter(tags=["reservations"])


class ReservationCreate(BaseModel):
    business_id: int
    reservation_date: datetime
    guest_count: int
    special_requests: Optional[str] = None


class ReservationUpdate(BaseModel):
    reservation_date: Optional[datetime] = None
    guest_count: Optional[int] = None
    special_requests: Optional[str] = None
    status: Optional[str] = None


class ReservationResponse(BaseModel):
    id: int
    user_id: int
    business_id: int
    reservation_date: datetime
    guest_count: int
    special_requests: Optional[str]
    status: str
    approval_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/reservations", response_model=List[ReservationResponse])
async def list_reservations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    skip: int = 0
):
    """List user's reservations"""
    reservations = db.query(Reservation).filter(
        Reservation.user_id == current_user.id
    ).order_by(Reservation.created_at.desc()).offset(skip).limit(limit).all()

    return reservations


@router.post("/reservations", response_model=ReservationResponse)
async def create_reservation(
    reservation_data: ReservationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new reservation"""

    # Validate business exists
    business = db.query(Business).filter(
        Business.id == reservation_data.business_id,
        Business.status == "active"
    ).first()

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found or inactive"
        )

    # Validate reservation date is not in past
    if reservation_data.reservation_date < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reservation date cannot be in the past"
        )

    # Validate guest count
    if reservation_data.guest_count < 1 or reservation_data.guest_count > business.daily_capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Guest count must be between 1 and {business.daily_capacity}"
        )

    reservation = Reservation(
        user_id=current_user.id,
        business_id=reservation_data.business_id,
        reservation_date=reservation_data.reservation_date,
        reservation_at=reservation_data.reservation_date,
        guest_count=reservation_data.guest_count,
        party_size=reservation_data.guest_count,
        special_requests=reservation_data.special_requests,
        status="pending",
        approval_status="pending",
        created_at=datetime.utcnow()
    )

    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    return reservation


@router.get("/reservations/{reservation_id}", response_model=ReservationResponse)
async def get_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific reservation"""

    reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id,
        Reservation.user_id == current_user.id
    ).first()

    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )

    return reservation


@router.patch("/reservations/{reservation_id}", response_model=ReservationResponse)
async def update_reservation(
    reservation_id: int,
    update_data: ReservationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a reservation"""

    reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id,
        Reservation.user_id == current_user.id
    ).first()

    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )

    # Cannot update confirmed or cancelled reservations
    if reservation.status in ["confirmed", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update {reservation.status} reservation"
        )

    if update_data.reservation_date:
        if update_data.reservation_date < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reservation date cannot be in the past"
            )
        reservation.reservation_date = update_data.reservation_date
        reservation.reservation_at = update_data.reservation_date

    if update_data.guest_count:
        business = db.query(Business).filter(
            Business.id == reservation.business_id
        ).first()
        if update_data.guest_count < 1 or update_data.guest_count > business.daily_capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Guest count must be between 1 and {business.daily_capacity}"
            )
        reservation.guest_count = update_data.guest_count
        reservation.party_size = update_data.guest_count

    if update_data.special_requests:
        reservation.special_requests = update_data.special_requests

    if update_data.status:
        reservation.status = update_data.status

    db.commit()
    db.refresh(reservation)

    return reservation


@router.post("/reservations/{reservation_id}/cancel")
async def cancel_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a reservation"""

    reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id,
        Reservation.user_id == current_user.id
    ).first()

    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )

    if reservation.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reservation is already cancelled"
        )

    reservation.status = "cancelled"
    db.commit()
    db.refresh(reservation)

    return {"status": "cancelled", "reservation_id": reservation.id}
