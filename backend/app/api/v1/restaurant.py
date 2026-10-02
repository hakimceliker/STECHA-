"""Restaurant owner endpoints"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from pydantic import BaseModel
from decimal import Decimal

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

    model_config = {"from_attributes": True}

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

    model_config = {"from_attributes": True}

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
    return BusinessResponse.model_validate(business)

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
    return BusinessResponse.model_validate(business)

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
    return [ReservationDetailResponse.model_validate(r) for r in reservations]

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

@router.post("/reservations/{reservation_id}/approve")
async def approve_reservation_owner(
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

    if reservation.approval_status != "pending":
        raise HTTPException(status_code=400, detail="Reservation is not pending")

    reservation.approval_status = "approved"
    reservation.status = "confirmed"
    db.commit()
    return {"status": "approved", "reservation_id": reservation_id}

@router.post("/reservations/{reservation_id}/reject")
async def reject_reservation_owner(
    reservation_id: int,
    business: Business = Depends(get_owner_business),
    db: Session = Depends(get_db),
    reason: Optional[str] = None
):
    reservation = db.query(Reservation).filter(
        and_(
            Reservation.id == reservation_id,
            Reservation.business_id == business.id
        )
    ).first()

    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    if reservation.approval_status != "pending":
        raise HTTPException(status_code=400, detail="Reservation is not pending")

    reservation.approval_status = "rejected"
    reservation.cancellation_reason = reason
    db.commit()
    return {"status": "rejected", "reservation_id": reservation_id}

@router.get("/pre-orders", response_model=list[dict])
async def get_my_pre_orders(
    business: Business = Depends(get_owner_business),
    db: Session = Depends(get_db),
    status_filter: Optional[str] = None,
    limit: int = 50
):
    query = db.query(PreOrder).filter(
        PreOrder.business_id == business.id
    )

    if status_filter:
        query = query.filter(PreOrder.approval_status == status_filter)

    pre_orders = query.order_by(PreOrder.created_at.desc()).limit(limit).all()

    return [
        {
            "id": po.id,
            "user_id": po.user_id,
            "items_description": po.items_description,
            "items_json": po.items_json,
            "pickup_date": po.pickup_date.isoformat() if po.pickup_date else None,
            "total_try": float(po.total_try),
            "payment_status": po.payment_status,
            "approval_status": po.approval_status,
            "created_at": po.created_at.isoformat()
        }
        for po in pre_orders
    ]

@router.post("/pre-orders/{pre_order_id}/approve")
async def approve_pre_order_owner(
    pre_order_id: int,
    business: Business = Depends(get_owner_business),
    db: Session = Depends(get_db)
):
    pre_order = db.query(PreOrder).filter(
        and_(
            PreOrder.id == pre_order_id,
            PreOrder.business_id == business.id
        )
    ).first()

    if not pre_order:
        raise HTTPException(status_code=404, detail="Pre-order not found")

    if pre_order.approval_status != "pending":
        raise HTTPException(status_code=400, detail="Pre-order is not pending")

    pre_order.approval_status = "approved"
    pre_order.status = "confirmed"
    db.commit()
    return {"status": "approved", "pre_order_id": pre_order_id}

@router.post("/pre-orders/{pre_order_id}/reject")
async def reject_pre_order_owner(
    pre_order_id: int,
    business: Business = Depends(get_owner_business),
    db: Session = Depends(get_db),
    reason: Optional[str] = None
):
    pre_order = db.query(PreOrder).filter(
        and_(
            PreOrder.id == pre_order_id,
            PreOrder.business_id == business.id
        )
    ).first()

    if not pre_order:
        raise HTTPException(status_code=404, detail="Pre-order not found")

    if pre_order.approval_status != "pending":
        raise HTTPException(status_code=400, detail="Pre-order is not pending")

    pre_order.approval_status = "rejected"
    db.commit()
    return {"status": "rejected", "pre_order_id": pre_order_id}

@router.get("/dashboard-metrics")
async def get_dashboard_metrics(
    business: Business = Depends(get_owner_business),
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard metrics for restaurant owner"""

    # Count reservations by status
    total_reservations = db.query(func.count(Reservation.id)).filter(
        Reservation.business_id == business.id
    ).scalar() or 0

    confirmed_reservations = db.query(func.count(Reservation.id)).filter(
        and_(Reservation.business_id == business.id, Reservation.status == "confirmed")
    ).scalar() or 0

    pending_reservation_approvals = db.query(func.count(Reservation.id)).filter(
        and_(Reservation.business_id == business.id, Reservation.approval_status == "pending")
    ).scalar() or 0

    # Count pre-orders by status
    total_pre_orders = db.query(func.count(PreOrder.id)).filter(
        PreOrder.business_id == business.id
    ).scalar() or 0

    confirmed_pre_orders = db.query(func.count(PreOrder.id)).filter(
        and_(PreOrder.business_id == business.id, PreOrder.status == "confirmed")
    ).scalar() or 0

    pending_pre_order_approvals = db.query(func.count(PreOrder.id)).filter(
        and_(PreOrder.business_id == business.id, PreOrder.approval_status == "pending")
    ).scalar() or 0

    # Calculate revenue
    reservation_revenue = db.query(func.sum(Reservation.id)).filter(
        and_(Reservation.business_id == business.id, Reservation.status == "confirmed")
    ).scalar() or 0

    pre_order_revenue = db.query(func.sum(PreOrder.total_try)).filter(
        and_(PreOrder.business_id == business.id, PreOrder.status == "confirmed", PreOrder.payment_status == "paid")
    ).scalar() or Decimal("0")

    return {
        "reservations": {
            "total": total_reservations,
            "confirmed": confirmed_reservations,
            "pending_approvals": pending_reservation_approvals
        },
        "pre_orders": {
            "total": total_pre_orders,
            "confirmed": confirmed_pre_orders,
            "pending_approvals": pending_pre_order_approvals
        },
        "revenue": {
            "from_reservations": float(reservation_revenue * 50) if reservation_revenue else 0.0,
            "from_pre_orders": float(pre_order_revenue),
            "total": float(reservation_revenue * 50 + (pre_order_revenue or Decimal("0")))
        },
        "capacity": {
            "daily_capacity": business.daily_capacity,
            "current_utilization": (confirmed_reservations / business.daily_capacity * 100) if business.daily_capacity > 0 else 0
        }
    }

@router.get("/upcoming-reservations")
async def get_upcoming_reservations(
    business: Business = Depends(get_owner_business),
    db: Session = Depends(get_db),
    days_ahead: int = 7
):
    """Get upcoming reservations for the next N days"""
    now = datetime.utcnow()
    future = now + timedelta(days=days_ahead)

    reservations = db.query(Reservation).filter(
        and_(
            Reservation.business_id == business.id,
            Reservation.reservation_date >= now,
            Reservation.reservation_date <= future,
            Reservation.status == "confirmed"
        )
    ).order_by(Reservation.reservation_date).all()

    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "reservation_date": r.reservation_date.isoformat(),
            "guest_count": r.guest_count,
            "special_requests": r.special_requests,
            "approval_status": r.approval_status
        }
        for r in reservations
    ]
