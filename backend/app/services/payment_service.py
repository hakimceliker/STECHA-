"""Payment Processing Service - iyzico Integration"""

import logging
from typing import Optional
from enum import Enum
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentRequest(BaseModel):
    user_id: int
    business_id: int
    amount: float
    currency: str = "TRY"
    description: str
    order_type: str  # "reservation" or "pre_order"
    order_id: int


class PaymentResponse(BaseModel):
    transaction_id: str
    status: PaymentStatus
    amount: float
    currency: str
    timestamp: str


class IyzicoPaymentService:
    """Payment processing with iyzico"""

    def __init__(self, api_key: str, secret_key: str, is_sandbox: bool = True):
        """Initialize iyzico client"""
        self.api_key = api_key
        self.secret_key = secret_key
        self.is_sandbox = is_sandbox
        self.base_url = "https://sandbox-api.iyzipay.com" if is_sandbox else "https://api.iyzipay.com"

        # In production: import iyzipay
        # from iyzipay import IyzipayResource

    def create_payment(self, payment: PaymentRequest) -> PaymentResponse:
        """Create payment transaction"""
        try:
            # In production: Use actual iyzico API
            # response = IyzipayResource.Payment.create({...})

            logger.info(f"Processing payment: {payment.amount} {payment.currency}")

            return PaymentResponse(
                transaction_id=f"iyz_{payment.order_id}_{payment.user_id}",
                status=PaymentStatus.COMPLETED,
                amount=payment.amount,
                currency=payment.currency,
                timestamp="2026-09-26T00:00:00Z"
            )
        except Exception as e:
            logger.error(f"Payment processing error: {str(e)}")
            return PaymentResponse(
                transaction_id="",
                status=PaymentStatus.FAILED,
                amount=payment.amount,
                currency=payment.currency,
                timestamp="2026-09-26T00:00:00Z"
            )

    def refund_payment(self, transaction_id: str, amount: float) -> dict:
        """Refund payment transaction"""
        try:
            logger.info(f"Refunding {amount} for transaction {transaction_id}")

            return {
                "status": "success",
                "transaction_id": transaction_id,
                "refund_id": f"ref_{transaction_id}",
                "amount": amount,
                "timestamp": "2026-09-26T00:00:00Z"
            }
        except Exception as e:
            logger.error(f"Refund error: {str(e)}")
            return {
                "status": "failed",
                "error": str(e)
            }

    def check_payment_status(self, transaction_id: str) -> dict:
        """Check payment status"""
        try:
            return {
                "transaction_id": transaction_id,
                "status": "completed",
                "timestamp": "2026-09-26T00:00:00Z"
            }
        except Exception as e:
            logger.error(f"Status check error: {str(e)}")
            return {"status": "unknown", "error": str(e)}


class StripePaymentService:
    """Alternative Stripe payment processing"""

    def __init__(self, api_key: str, is_live: bool = False):
        """Initialize Stripe client"""
        self.api_key = api_key
        self.is_live = is_live

        # In production: import stripe
        # stripe.api_key = api_key

    def create_payment_intent(self, payment: PaymentRequest) -> dict:
        """Create Stripe payment intent"""
        try:
            logger.info(f"Creating Stripe intent for {payment.amount} {payment.currency}")

            return {
                "intent_id": f"pi_{payment.order_id}",
                "client_secret": f"secret_{payment.order_id}",
                "amount": int(payment.amount * 100),  # Convert to cents
                "currency": payment.currency,
                "status": "requires_payment_method"
            }
        except Exception as e:
            logger.error(f"Stripe intent creation error: {str(e)}")
            return {"error": str(e)}

    def confirm_payment(self, intent_id: str) -> dict:
        """Confirm Stripe payment"""
        try:
            return {
                "intent_id": intent_id,
                "status": "succeeded",
                "timestamp": "2026-09-26T00:00:00Z"
            }
        except Exception as e:
            logger.error(f"Stripe confirmation error: {str(e)}")
            return {"status": "failed", "error": str(e)}


class PaymentServiceFactory:
    """Factory for creating payment service instances"""

    @staticmethod
    def create_service(provider: str, **kwargs):
        """Create payment service based on provider"""
        if provider == "iyzico":
            return IyzicoPaymentService(
                api_key=kwargs.get("api_key"),
                secret_key=kwargs.get("secret_key"),
                is_sandbox=kwargs.get("is_sandbox", True)
            )
        elif provider == "stripe":
            return StripePaymentService(
                api_key=kwargs.get("api_key"),
                is_live=kwargs.get("is_live", False)
            )
        else:
            raise ValueError(f"Unknown payment provider: {provider}")
