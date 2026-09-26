"""Admin endpoints"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from pydantic import BaseModel

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.db.base import User, Reservation, PreOrder, Message, WaitlistEntry, Business

router = APIRouter(prefix="/admin", tags=["admin"])

class MetricsResponse(BaseModel):
    total_users: int
    total_conversations: int
    total_reservations: int
    total_pre_orders: int
    total_waitlist: int
    pending_approvals: int
    revenue_estimate: float

class AdminStatsResponse(BaseModel):
    date: str
    users: int
    reservations: int
    pre_orders: int
    revenue: float

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    locale: str
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    locale: Optional[str] = None
    is_admin: Optional[bool] = None

class ApprovalQueueItem(BaseModel):
    id: int
    user_id: int
    business_id: int
    type: str  # "reservation" or "pre_order"
    created_at: datetime
    detail: dict

class BusinessResponse(BaseModel):
    id: int
    owner_id: int
    type: str
    name: str
    status: str
    commission_rate: float
    created_at: datetime

    class Config:
        from_attributes = True

def check_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics(
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_conversations = db.query(func.count(User.id)).filter(User.id.isnot(None)).scalar() or 0
    total_reservations = db.query(func.count(Reservation.id)).scalar() or 0
    total_pre_orders = db.query(func.count(PreOrder.id)).scalar() or 0
    total_waitlist = db.query(func.count(WaitlistEntry.id)).scalar() or 0

    pending_approvals = db.query(func.count(Reservation.id)).filter(
        and_(
            Reservation.status == "pending",
            Reservation.approval_status == "pending"
        )
    ).scalar() or 0

    return {
        "total_users": total_users,
        "total_conversations": total_conversations,
        "total_reservations": total_reservations,
        "total_pre_orders": total_pre_orders,
        "total_waitlist": total_waitlist,
        "pending_approvals": pending_approvals,
        "revenue_estimate": total_reservations * 50 + total_pre_orders * 30
    }

@router.get("/approval-queue")
async def get_approval_queue(
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db),
    limit: int = 100,
    skip: int = 0,
    type: Optional[str] = None  # "reservation" or "pre_order"
):
    items = []

    if type is None or type == "reservation":
        reservations = db.query(Reservation).filter(
            Reservation.approval_status == "pending"
        ).order_by(Reservation.created_at.desc()).offset(skip).limit(limit).all()

        for r in reservations:
            items.append({
                "id": r.id,
                "type": "reservation",
                "user_id": r.user_id,
                "business_id": r.business_id,
                "created_at": r.created_at,
                "detail": {
                    "reservation_date": r.reservation_date.isoformat(),
                    "guest_count": r.guest_count,
                    "approval_score": r.approval_score
                }
            })

    if type is None or type == "pre_order":
        pre_orders = db.query(PreOrder).filter(
            PreOrder.approval_status == "pending"
        ).order_by(PreOrder.created_at.desc()).offset(skip).limit(limit).all()

        for p in pre_orders:
            items.append({
                "id": p.id,
                "type": "pre_order",
                "user_id": p.user_id,
                "business_id": p.business_id,
                "created_at": p.created_at,
                "detail": {
                    "pickup_date": p.pickup_date.isoformat() if p.pickup_date else None,
                    "total_try": float(p.total_try),
                    "items_count": len(p.items_json) if p.items_json else 0
                }
            })

    return sorted(items, key=lambda x: x["created_at"], reverse=True)

@router.get("/reservations/pending")
async def get_pending_reservations(
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db),
    limit: int = 50
):
    reservations = db.query(Reservation).filter(
        Reservation.approval_status == "pending"
    ).limit(limit).all()

    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "business_id": r.business_id,
            "reservation_date": r.reservation_date,
            "guest_count": r.guest_count,
            "approval_status": r.approval_status,
            "ai_score": r.approval_score
        }
        for r in reservations
    ]

@router.get("/pre-orders/pending")
async def get_pending_pre_orders(
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db),
    limit: int = 50
):
    pre_orders = db.query(PreOrder).filter(
        PreOrder.approval_status == "pending"
    ).limit(limit).all()

    return [
        {
            "id": p.id,
            "user_id": p.user_id,
            "business_id": p.business_id,
            "pickup_date": p.pickup_date,
            "total_try": float(p.total_try),
            "approval_status": p.approval_status
        }
        for p in pre_orders
    ]

@router.post("/reservations/{reservation_id}/approve")
async def approve_reservation(
    reservation_id: int,
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db)
):
    reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id
    ).first()

    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    if reservation.approval_status != "pending":
        raise HTTPException(status_code=400, detail="Reservation is not pending approval")

    reservation.approval_status = "approved"
    reservation.status = "confirmed"
    db.commit()

    return {"status": "approved", "id": reservation_id}

@router.post("/reservations/{reservation_id}/reject")
async def reject_reservation(
    reservation_id: int,
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db),
    reason: Optional[str] = None
):
    reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id
    ).first()

    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    if reservation.approval_status != "pending":
        raise HTTPException(status_code=400, detail="Reservation is not pending approval")

    reservation.approval_status = "rejected"
    reservation.cancellation_reason = reason
    db.commit()

    return {"status": "rejected", "id": reservation_id, "reason": reason}

@router.post("/pre-orders/{pre_order_id}/approve")
async def approve_pre_order(
    pre_order_id: int,
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db)
):
    pre_order = db.query(PreOrder).filter(
        PreOrder.id == pre_order_id
    ).first()

    if not pre_order:
        raise HTTPException(status_code=404, detail="Pre-order not found")

    if pre_order.approval_status != "pending":
        raise HTTPException(status_code=400, detail="Pre-order is not pending approval")

    pre_order.approval_status = "approved"
    pre_order.status = "confirmed"
    db.commit()

    return {"status": "approved", "id": pre_order_id}

@router.post("/pre-orders/{pre_order_id}/reject")
async def reject_pre_order(
    pre_order_id: int,
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db),
    reason: Optional[str] = None
):
    pre_order = db.query(PreOrder).filter(
        PreOrder.id == pre_order_id
    ).first()

    if not pre_order:
        raise HTTPException(status_code=404, detail="Pre-order not found")

    if pre_order.approval_status != "pending":
        raise HTTPException(status_code=400, detail="Pre-order is not pending approval")

    pre_order.approval_status = "rejected"
    db.commit()

    return {"status": "rejected", "id": pre_order_id, "reason": reason}

@router.get("/businesses", response_model=list[BusinessResponse])
async def list_businesses(
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db),
    limit: int = 100,
    skip: int = 0,
    status: Optional[str] = None
):
    query = db.query(Business)

    if status:
        query = query.filter(Business.status == status)

    businesses = query.offset(skip).limit(limit).all()
    return businesses

@router.get("/businesses/{business_id}", response_model=BusinessResponse)
async def get_business(
    business_id: int,
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db)
):
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business

@router.post("/businesses/{business_id}/suspend")
async def suspend_business(
    business_id: int,
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db),
    reason: Optional[str] = None
):
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    business.status = "suspended"
    db.commit()
    return {"status": "suspended", "id": business_id, "reason": reason}

@router.get("/users", response_model=list[UserResponse])
async def list_users(
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db),
    limit: int = 100,
    skip: int = 0,
    search: Optional[str] = None,
    is_admin: Optional[bool] = None
):
    query = db.query(User).filter(User.deleted_at.is_(None))

    if search:
        query = query.filter(or_(
            User.email.ilike(f"%{search}%"),
            User.name.ilike(f"%{search}%")
        ))

    if is_admin is not None:
        query = query.filter(User.is_admin == is_admin)

    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        and_(User.id == user_id, User.deleted_at.is_(None))
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    data: UpdateUserRequest,
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        and_(User.id == user_id, User.deleted_at.is_(None))
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent last admin from removing admin status
    if admin.id == user_id and data.is_admin is False:
        admin_count = db.query(func.count(User.id)).filter(
            and_(User.is_admin == True, User.deleted_at.is_(None))
        ).scalar() or 0
        if admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot remove admin status from last admin"
            )

    if data.name is not None:
        user.name = data.name
    if data.locale is not None:
        user.locale = data.locale
    if data.is_admin is not None:
        user.is_admin = data.is_admin

    db.commit()
    db.refresh(user)
    return user

@router.post("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db)
):
    if admin.id == user_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate your own account"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.deleted_at = datetime.utcnow()
    db.commit()
    return {"status": "deactivated", "user_id": user_id}

@router.post("/users/{user_id}/promote-admin")
async def promote_admin(
    user_id: int,
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_admin = True
    db.commit()
    return {"status": "promoted", "user_id": user_id}
