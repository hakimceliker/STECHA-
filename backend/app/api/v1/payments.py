"""Payment endpoints - Stripe integration"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.db.base import User, Plan, Subscription, Payment, PaymentEvent
from app.services.stripe_gateway import StripeGateway

router = APIRouter(prefix="/payments", tags=["payments"])


class PlanResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    amount_cents: int
    currency: str
    billing_interval: str
    features: dict
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SubscriptionResponse(BaseModel):
    id: int
    user_id: int
    plan_id: int
    stripe_subscription_id: str
    status: str
    current_period_start: datetime
    current_period_end: datetime
    cancel_at: Optional[datetime]
    canceled_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentResponse(BaseModel):
    id: int
    user_id: int
    subscription_id: Optional[int]
    amount_cents: int
    currency: str
    status: str
    payment_method_type: str
    receipt_url: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class CheckoutSessionRequest(BaseModel):
    plan_id: int
    success_url: str
    cancel_url: str


class CheckoutSessionResponse(BaseModel):
    session_id: str
    checkout_url: str


class CancelSubscriptionRequest(BaseModel):
    at_period_end: bool = True


@router.get("/plans", response_model=List[PlanResponse])
async def get_plans(db: Session = Depends(get_db)):
    """Get all active subscription plans"""
    plans = db.query(Plan).filter(Plan.is_active == True).all()
    return plans


@router.get("/plans/{plan_id}", response_model=PlanResponse)
async def get_plan(plan_id: int, db: Session = Depends(get_db)):
    """Get specific subscription plan"""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    return plan


@router.post("/checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: CheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create Stripe checkout session for plan subscription"""
    # Get plan
    plan = db.query(Plan).filter(Plan.id == request.plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )

    # Create or get Stripe customer
    customer_email = current_user.email
    customer_name = current_user.name

    try:
        customer_result = StripeGateway.create_customer(customer_email, customer_name)
        customer_id = customer_result["customer_id"]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create customer: {str(e)}"
        )

    # Create checkout session
    try:
        session_result = StripeGateway.create_checkout_session(
            customer_id=customer_id,
            price_id=plan.stripe_price_id,
            success_url=request.success_url,
            cancel_url=request.cancel_url
        )
        return {
            "session_id": session_result["session_id"],
            "checkout_url": session_result["url"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout session: {str(e)}"
        )


@router.get("/subscription", response_model=Optional[SubscriptionResponse])
async def get_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's active subscription"""
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status.in_(["active", "past_due"])
    ).first()

    return subscription


@router.post("/subscription/{subscription_id}/cancel")
async def cancel_subscription(
    subscription_id: int,
    request: CancelSubscriptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel user's subscription"""
    # Verify subscription belongs to user
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id,
        Subscription.user_id == current_user.id
    ).first()

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )

    # Cancel via Stripe
    try:
        result = StripeGateway.cancel_subscription(
            subscription.stripe_subscription_id,
            at_period_end=request.at_period_end
        )

        # Update local subscription status
        if not request.at_period_end:
            subscription.status = "canceled"
            subscription.canceled_at = datetime.utcnow()
        else:
            subscription.cancel_at = result.get("cancel_at")

        db.commit()
        db.refresh(subscription)

        return {
            "status": "success",
            "subscription": SubscriptionResponse.model_validate(subscription).model_dump()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel subscription: {str(e)}"
        )


@router.get("/payments", response_model=List[PaymentResponse])
async def get_user_payments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's payment history"""
    payments = db.query(Payment).filter(
        Payment.user_id == current_user.id
    ).order_by(Payment.created_at.desc()).all()

    return payments


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle Stripe webhook events"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    endpoint_secret = "whsec_test_secret"  # Use environment variable in production

    try:
        event = StripeGateway.verify_webhook_signature(payload, sig_header, endpoint_secret)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Check if event already processed
    existing_event = db.query(PaymentEvent).filter(
        PaymentEvent.stripe_event_id == event["id"]
    ).first()

    if existing_event:
        return {"status": "already_processed"}

    # Store raw event
    payment_event = PaymentEvent(
        stripe_event_id=event["id"],
        event_type=event["type"],
        event_data=event["data"]["object"]
    )
    db.add(payment_event)

    # Process event
    try:
        processed = StripeGateway.process_webhook_event(event)

        if event["type"] == "charge.succeeded":
            # Create payment record
            payment = Payment(
                user_id=None,  # Will be linked if we have customer mapping
                stripe_payment_intent_id=processed.get("payment_intent_id"),
                stripe_charge_id=processed.get("charge_id"),
                amount_cents=processed.get("amount_cents"),
                currency="usd",
                status="succeeded",
                payment_method_type="card"
            )
            db.add(payment)

        elif event["type"] == "customer.subscription.created":
            # Link subscription to user and update local DB
            # This requires mapping stripe_customer_id to user_id
            subscription_id = processed.get("subscription_id")
            customer_id = processed.get("customer_id")

            # In production, maintain a mapping of stripe_customer_id to user_id
            # For now, we store the webhook data for async processing
            payment_event.subscription_id = subscription_id

        elif event["type"] == "customer.subscription.updated":
            # Update subscription status
            # Similar mapping required
            pass

        payment_event.processed = True
        db.commit()

        return {"status": "success", "event_id": event["id"]}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook processing error: {str(e)}"
        )
