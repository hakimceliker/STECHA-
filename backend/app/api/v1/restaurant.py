"""Restaurant owner endpoints"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from pydantic import BaseModel

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.db.base import User, Business, Reservation, PreOrder

router = APIRouter(prefix="/restaurant", tags=["restaurant"])

class BusinessResponse(BaseModel):
    id: int
    owner_id: int
    name: str
    address: str
    phone: str
    email: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True

class BusinessStatsResponse(BaseModel):
    business_id: int
    total_reservations: int
    total_pre_orders: int
    pending_approvals: int
    daily_capacity: int
    current_utilization: float
    revenue_estimate: float

class ReservationDetailResponse(BaseModel):
    id: int
    user_id: int
    guest_count: int
    reservation_date: str
    special_requests: str
    approval_status: str
    approval_score: float
    created_at: datetime

    class Config:
        from_attributes = True

async def get_owner_business(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Business:
    business = db.query(Business).filter(
        Business.owner_id == current_user.id
    ).first()

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No business found for this owner"
        )
    return business

@router.get("/my-business", response_model=BusinessResponse)
async def get_my_business(business: Business = Depends(get_owner_business)):
    return BusinessResponse.from_orm(business)

@router.put("/my-business")
async def update_my_business(
    name: str = None,
    phone: str = None,
    email: str = None,
    description: str = None,
    business: Business = Depends(get_owner_business),
    db: Session = Depends(get_db)
):
    if name:
        business.name = name
    if phone:
        business.phone = phone
    if email:
        business.email = email
    if description:
        business.description = description

    db.commit()
    return BusinessResponse.from_orm(business)

@router.get("/stats", response_model=BusinessStatsResponse)
async def get_business_stats(
    business: Business = Depends(get_owner_business),
    db: Session = Depends(get_db)
):
    total_reservations = db.query(func.count(Reservation.id)).filter(
        Reservation.business_id == business.id
    ).scalar() or 0

    total_pre_orders = db.query(func.count(PreOrder.id)).filter(
        PreOrder.business_id == business.id
    ).scalar() or 0

    pending_approvals = db.query(func.count(Reservation.id)).filter(
        and_(
            Reservation.business_id == business.id,
            Reservation.approval_status == "pending"
        )
    ).scalar() or 0

    daily_capacity = getattr(business, 'daily_capacity', 100)
    current_utilization = (total_reservations % daily_capacity) / daily_capacity if daily_capacity > 0 else 0

    return {
        "business_id": business.id,
        "total_reservations": total_reservations,
        "total_pre_orders": total_pre_orders,
        "pending_approvals": pending_approvals,
        "daily_capacity": daily_capacity,
        "current_utilization": current_utilization,
        "revenue_estimate": total_reservations * 50 + total_pre_orders * 30
    }

@router.get("/reservations", response_model=list[ReservationDetailResponse])
async def get_my_reservations(
    business: Business = Depends(get_owner_business),
    db: Session = Depends(get_db),
    status_filter: str = None,
    limit: int = 50
):
    query = db.query(Reservation).filter(
        Reservation.business_id == business.id
    )

    if status_filter:
        query = query.filter(Reservation.approval_status == status_filter)

    reservations = query.order_by(Reservation.created_at.desc()).limit(limit).all()
    return [ReservationDetailResponse.from_orm(r) for r in reservations]

@router.post("/reservations/{reservation_id}/approve")
async def approve_reservation(
    reservation_id: int,
    business: Business = Depends(get_owner_business),
    db: Session = Depends(get_db)
):
    reservation = db.query(Reservation).filter(
        and_(
            Reservation.id == reservation_id,
            Reservation.business_id == business.id
        )
    ).first()

    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    reservation.approval_status = "approved"
    db.commit()
    return {"status": "approved", "reservation_id": reservation_id}

@router.post("/reservations/{reservation_id}/reject")
async def reject_reservation(
    reservation_id: int,
    business: Business = Depends(get_owner_business),
    db: Session = Depends(get_db),
    reason: str = None
):
    reservation = db.query(Reservation).filter(
        and_(
            Reservation.id == reservation_id,
            Reservation.business_id == business.id
        )
    ).first()

    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    reservation.approval_status = "rejected"
    db.commit()
    return {"status": "rejected", "reservation_id": reservation_id}

@router.get("/pre-orders", response_model=list[dict])
async def get_my_pre_orders(
    business: Business = Depends(get_owner_business),
    db: Session = Depends(get_db),
    limit: int = 50
):
    pre_orders = db.query(PreOrder).filter(
        PreOrder.business_id == business.id
    ).order_by(PreOrder.created_at.desc()).limit(limit).all()

    return [
        {
            "id": po.id,
            "user_id": po.user_id,
            "items_description": po.items_description,
            "pickup_date": po.pickup_date,
            "payment_status": po.payment_status,
            "approval_status": po.approval_status,
            "created_at": po.created_at
        }
        for po in pre_orders
    ]
