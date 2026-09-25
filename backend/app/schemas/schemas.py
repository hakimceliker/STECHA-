from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ---- Auth ----

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    locale: str

    model_config = {"from_attributes": True}


# ---- Chat ----

class ConversationOut(BaseModel):
    id: str
    title: str
    pinned: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageIn(BaseModel):
    content: str


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- Documents ----

class DocumentOut(BaseModel):
    id: str
    type: str
    status: str
    pages: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- Places / Yol Asistanı ----

class PlaceOut(BaseModel):
    id: str
    type: str
    name: str
    address: str
    lat: float
    lng: float
    status: str


class BookingIn(BaseModel):
    business_id: str
    amount_try: float


class BookingOut(BaseModel):
    id: str
    business_id: str
    amount_try: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- Wallet ----

class WalletOut(BaseModel):
    balance_try: float


class TransactionOut(BaseModel):
    id: str
    type: str
    amount_try: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- Admin ----

class AdminSummary(BaseModel):
    total_users: int
    total_conversations: int
    total_documents: int
    total_businesses: int
    total_bookings: int
