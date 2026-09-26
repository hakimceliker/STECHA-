"""Admin endpoints"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from pydantic import BaseModel

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.db.base import User, Reservation, PreOrder, Message, WaitlistEntry

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

    reservation.approval_status = "approved"
    db.commit()

    return {"status": "approved", "id": reservation_id}

@router.post("/reservations/{reservation_id}/reject")
async def reject_reservation(
    reservation_id: int,
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db),
    reason: str = None
):
    reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id
    ).first()

    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    reservation.approval_status = "rejected"
    db.commit()

    return {"status": "rejected", "id": reservation_id, "reason": reason}

@router.get("/users")
async def list_users(
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db),
    limit: int = 100,
    skip: int = 0
):
    users = db.query(User).offset(skip).limit(limit).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "locale": u.locale,
            "is_admin": u.is_admin,
            "created_at": u.created_at
        }
        for u in users
    ]

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

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(check_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.deleted_at = datetime.utcnow()
    db.commit()
    return {"status": "deleted", "user_id": user_id}
