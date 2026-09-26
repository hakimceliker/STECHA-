"""Stripe Payment Gateway Service"""

import os
from typing import Optional
import stripe
from app.db.base import Plan, Subscription, Payment, PaymentEvent

stripe.api_key = os.getenv("STRIPE_API_KEY", "sk_test_fake_key")


class StripeGateway:
    """Handle Stripe payment operations"""

    @staticmethod
    def create_checkout_session(customer_id: str, price_id: str, success_url: str, cancel_url: str) -> dict:
        """Create Stripe checkout session for subscription"""
        try:
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                line_items=[
                    {
                        "price": price_id,
                        "quantity": 1,
                    }
                ],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
            )
            return {"session_id": session.id, "url": session.url}
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe checkout error: {str(e)}")

    @staticmethod
    def create_customer(email: str, name: str = None) -> dict:
        """Create Stripe customer"""
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
            )
            return {"customer_id": customer.id, "email": customer.email}
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe customer creation error: {str(e)}")

    @staticmethod
    def get_customer(customer_id: str) -> dict:
        """Get Stripe customer details"""
        try:
            customer = stripe.Customer.retrieve(customer_id)
            return {
                "customer_id": customer.id,
                "email": customer.email,
                "name": customer.name,
                "subscriptions": customer.subscriptions.data if customer.subscriptions else [],
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe customer retrieval error: {str(e)}")

    @staticmethod
    def cancel_subscription(subscription_id: str, at_period_end: bool = True) -> dict:
        """Cancel a Stripe subscription"""
        try:
            if at_period_end:
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True,
                )
            else:
                subscription = stripe.Subscription.delete(subscription_id)

            return {
                "subscription_id": subscription.id,
                "status": subscription.status,
                "cancel_at": subscription.cancel_at,
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe subscription cancellation error: {str(e)}")

    @staticmethod
    def get_subscription(subscription_id: str) -> dict:
        """Get Stripe subscription details"""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return {
                "subscription_id": subscription.id,
                "customer_id": subscription.customer,
                "status": subscription.status,
                "current_period_start": subscription.current_period_start,
                "current_period_end": subscription.current_period_end,
                "items": subscription.items.data if subscription.items else [],
                "metadata": subscription.metadata,
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe subscription retrieval error: {str(e)}")

    @staticmethod
    def verify_webhook_signature(payload: bytes, sig_header: str, endpoint_secret: str) -> dict:
        """Verify Stripe webhook signature"""
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
            return event
        except ValueError:
            raise Exception("Invalid webhook payload")
        except stripe.error.SignatureVerificationError:
            raise Exception("Invalid webhook signature")

    @staticmethod
    def process_webhook_event(event: dict) -> dict:
        """Process Stripe webhook event and return action data"""
        event_type = event["type"]
        event_id = event["id"]
        data = event["data"]["object"]

        if event_type == "charge.succeeded":
            return {
                "event_type": "charge.succeeded",
                "event_id": event_id,
                "payment_intent_id": data.get("payment_intent"),
                "charge_id": data.get("id"),
                "customer_id": data.get("customer"),
                "amount_cents": data.get("amount"),
                "status": "succeeded",
            }

        elif event_type == "customer.subscription.created":
            return {
                "event_type": "subscription.created",
                "event_id": event_id,
                "subscription_id": data.get("id"),
                "customer_id": data.get("customer"),
                "status": data.get("status"),
                "plan_id": data.get("items").data[0].plan.id if data.get("items") else None,
            }

        elif event_type == "customer.subscription.updated":
            return {
                "event_type": "subscription.updated",
                "event_id": event_id,
                "subscription_id": data.get("id"),
                "customer_id": data.get("customer"),
                "status": data.get("status"),
                "cancel_at": data.get("cancel_at"),
            }

        elif event_type == "customer.subscription.deleted":
            return {
                "event_type": "subscription.deleted",
                "event_id": event_id,
                "subscription_id": data.get("id"),
                "customer_id": data.get("customer"),
                "status": "canceled",
            }

        elif event_type == "payment_intent.payment_failed":
            return {
                "event_type": "payment_failed",
                "event_id": event_id,
                "payment_intent_id": data.get("id"),
                "customer_id": data.get("customer"),
                "status": "failed",
            }

        return {
            "event_type": event_type,
            "event_id": event_id,
        }
