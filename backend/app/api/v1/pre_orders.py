"""Pre-Orders endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List, Dict, Any
import json
import uuid

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.db.base import User, PreOrder, Business

router = APIRouter(tags=["pre_orders"])


class PreOrderCreate(BaseModel):
    business_id: int
    items: List[Dict[str, Any]]
    items_description: Optional[str] = None
    pickup_date: Optional[datetime] = None
    total_try: float


class PreOrderUpdate(BaseModel):
    items: Optional[List[Dict[str, Any]]] = None
    items_description: Optional[str] = None
    pickup_date: Optional[datetime] = None
    total_try: Optional[float] = None
    status: Optional[str] = None


class PreOrderResponse(BaseModel):
    id: int
    user_id: int
    business_id: int
    items_json: List[Dict[str, Any]]
    items_description: Optional[str]
    pickup_date: Optional[datetime]
    total_try: float
    currency: str
    payment_status: str
    status: str
    approval_status: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/pre-orders", response_model=List[PreOrderResponse])
async def list_pre_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    skip: int = 0
):
    """List user's pre-orders"""
    pre_orders = db.query(PreOrder).filter(
        PreOrder.user_id == current_user.id
    ).order_by(PreOrder.created_at.desc()).offset(skip).limit(limit).all()

    return pre_orders


@router.post("/pre-orders", response_model=PreOrderResponse)
async def create_pre_order(
    pre_order_data: PreOrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new pre-order"""

    # Validate business exists
    business = db.query(Business).filter(
        Business.id == pre_order_data.business_id,
        Business.status == "active"
    ).first()

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found or inactive"
        )

    # Validate items exist
    if not pre_order_data.items or len(pre_order_data.items) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pre-order must contain at least one item"
        )

    # Validate total price
    if pre_order_data.total_try <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Total price must be greater than 0"
        )

    # Validate pickup date if provided (not in past)
    if pre_order_data.pickup_date:
        if pre_order_data.pickup_date < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pickup date cannot be in the past"
            )

    pre_order = PreOrder(
        user_id=current_user.id,
        business_id=pre_order_data.business_id,
        items_json=pre_order_data.items,
        items_description=pre_order_data.items_description,
        pickup_date=pre_order_data.pickup_date,
        total_try=pre_order_data.total_try,
        currency="TRY",
        payment_status="pending",
        status="pending",
        approval_status="pending",
        idempotency_key=str(uuid.uuid4()),
        created_at=datetime.utcnow()
    )

    db.add(pre_order)
    db.commit()
    db.refresh(pre_order)

    return pre_order


@router.get("/pre-orders/{pre_order_id}", response_model=PreOrderResponse)
async def get_pre_order(
    pre_order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific pre-order"""

    pre_order = db.query(PreOrder).filter(
        PreOrder.id == pre_order_id,
        PreOrder.user_id == current_user.id
    ).first()

    if not pre_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pre-order not found"
        )

    return pre_order


@router.patch("/pre-orders/{pre_order_id}", response_model=PreOrderResponse)
async def update_pre_order(
    pre_order_id: int,
    update_data: PreOrderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a pre-order"""

    pre_order = db.query(PreOrder).filter(
        PreOrder.id == pre_order_id,
        PreOrder.user_id == current_user.id
    ).first()

    if not pre_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pre-order not found"
        )

    # Cannot update confirmed or cancelled pre-orders
    if pre_order.status in ["confirmed", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update {pre_order.status} pre-order"
        )

    if update_data.items is not None:
        if len(update_data.items) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pre-order must contain at least one item"
            )
        pre_order.items_json = update_data.items

    if update_data.items_description:
        pre_order.items_description = update_data.items_description

    if update_data.pickup_date:
        if update_data.pickup_date < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pickup date cannot be in the past"
            )
        pre_order.pickup_date = update_data.pickup_date

    if update_data.total_try:
        if update_data.total_try <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Total price must be greater than 0"
            )
        pre_order.total_try = update_data.total_try

    if update_data.status:
        pre_order.status = update_data.status

    db.commit()
    db.refresh(pre_order)

    return pre_order


@router.post("/pre-orders/{pre_order_id}/cancel")
async def cancel_pre_order(
    pre_order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a pre-order"""

    pre_order = db.query(PreOrder).filter(
        PreOrder.id == pre_order_id,
        PreOrder.user_id == current_user.id
    ).first()

    if not pre_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pre-order not found"
        )

    if pre_order.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pre-order is already cancelled"
        )

    pre_order.status = "cancelled"
    db.commit()
    db.refresh(pre_order)

    return {"status": "cancelled", "pre_order_id": pre_order.id}
