"""Database Base and Models"""

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text, JSON
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    name = Column(String)
    locale = Column(String, default="tr")
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    title = Column(String)
    pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, index=True)
    role = Column(String)  # "user" or "assistant"
    content = Column(Text)
    model = Column(String)
    tokens_in = Column(Integer, default=0)
    tokens_out = Column(Integer, default=0)
    cost_usd = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, index=True)
    type = Column(String)  # "restaurant", "cafe", etc.
    name = Column(String)
    address = Column(String)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    coordinates = Column(JSON)
    tax_no = Column(String, unique=True)
    daily_capacity = Column(Integer, default=100)
    status = Column(String, default="active")
    commission_rate = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    business_id = Column(Integer, index=True)
    reservation_date = Column(DateTime)
    reservation_at = Column(DateTime)
    guest_count = Column(Integer)
    party_size = Column(Integer)
    special_requests = Column(Text, nullable=True)
    status = Column(String, default="pending")  # pending, confirmed, cancelled
    approval_status = Column(String, default="pending")  # pending, approved, rejected
    approval_score = Column(Float, default=0.0)
    cancellation_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PreOrder(Base):
    __tablename__ = "pre_orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    business_id = Column(Integer, index=True)
    items_json = Column(JSON)
    items_description = Column(Text, nullable=True)
    pickup_date = Column(DateTime, nullable=True)
    total_try = Column(Float)
    currency = Column(String, default="TRY")
    payment_status = Column(String, default="pending")  # pending, paid, refunded
    payment_ref = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, confirmed, cancelled
    approval_status = Column(String, default="pending")  # pending, approved, rejected
    idempotency_key = Column(String, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    business_id = Column(Integer, nullable=True, index=True)
    filename = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)
    mime_type = Column(String)
    document_type = Column(String)  # "invoice", "receipt", "contract", "other"
    extracted_text = Column(Text, nullable=True)  # OCR/extraction result
    doc_metadata = Column(JSON, nullable=True)  # document-specific metadata
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ConversationMessage(Base):
    __tablename__ = "conversation_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, index=True)
    user_id = Column(Integer, index=True)
    role = Column(String)  # "user", "assistant", "system"
    content = Column(Text)
    model = Column(String, nullable=True)
    provider = Column(String, default="openai")  # openai, anthropic, cohere
    tokens_in = Column(Integer, default=0)
    tokens_out = Column(Integer, default=0)
    cost_usd = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class WaitlistEntry(Base):
    __tablename__ = "waitlist_entries"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, nullable=True)
    name = Column(String)
    source = Column(String)  # "landing_page", "mobile_app", "organic", etc.
    campaign_source = Column(String, nullable=True)  # utm_source, utm_campaign, etc.
    consent_marketing = Column(Boolean, default=False)
    consent_terms = Column(Boolean, default=False)
    status = Column(String, default="active")  # active, converted, inactive
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    stripe_product_id = Column(String, unique=True, index=True)
    stripe_price_id = Column(String, unique=True, index=True)
    name = Column(String)
    description = Column(Text, nullable=True)
    amount_cents = Column(Integer)
    currency = Column(String, default="usd")
    billing_interval = Column(String)
    features = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    plan_id = Column(Integer, index=True)
    stripe_subscription_id = Column(String, unique=True, index=True)
    stripe_customer_id = Column(String, index=True)
    status = Column(String)
    current_period_start = Column(DateTime)
    current_period_end = Column(DateTime)
    cancel_at = Column(DateTime, nullable=True)
    canceled_at = Column(DateTime, nullable=True)
    subscription_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    subscription_id = Column(Integer, nullable=True, index=True)
    stripe_payment_intent_id = Column(String, unique=True, index=True)
    stripe_charge_id = Column(String, nullable=True, unique=True, index=True)
    amount_cents = Column(Integer)
    currency = Column(String, default="usd")
    status = Column(String)
    payment_method_type = Column(String)
    receipt_url = Column(String, nullable=True)
    payment_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PaymentEvent(Base):
    __tablename__ = "payment_events"

    id = Column(Integer, primary_key=True, index=True)
    stripe_event_id = Column(String, unique=True, index=True)
    event_type = Column(String)
    user_id = Column(Integer, nullable=True, index=True)
    subscription_id = Column(Integer, nullable=True, index=True)
    payment_id = Column(Integer, nullable=True, index=True)
    event_data = Column(JSON)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
