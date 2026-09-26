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
    type = Column(String)  # "restaurant", "cafe", etc.
    name = Column(String)
    address = Column(String)
    coordinates = Column(JSON)
    tax_no = Column(String, unique=True)
    status = Column(String, default="active")
    commission_rate = Column(Float, default=0.0)


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    business_id = Column(Integer, index=True)
    reservation_at = Column(DateTime)
    party_size = Column(Integer)
    status = Column(String, default="pending")  # pending, confirmed, cancelled
    cancellation_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PreOrder(Base):
    __tablename__ = "pre_orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    business_id = Column(Integer, index=True)
    items_json = Column(JSON)
    total_try = Column(Float)
    currency = Column(String, default="TRY")
    payment_status = Column(String, default="pending")  # pending, paid, refunded
    payment_ref = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, confirmed, cancelled
    idempotency_key = Column(String, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class WaitlistEntry(Base):
    __tablename__ = "waitlist_entries"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    source = Column(String)  # "landing_page", "mobile_app", etc.
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
