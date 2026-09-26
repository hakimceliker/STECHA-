"""Stech AI Backend - FastAPI Application"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.api.v1 import auth, chat, conversations, places, reservations, pre_orders, waitlist, wallet, admin, restaurant

# Create tables if AUTO_CREATE_SCHEMA is enabled
if settings.AUTO_CREATE_SCHEMA:
    Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    print("✅ Application startup")
    yield
    print("🛑 Application shutdown")


app = FastAPI(
    title="Stech AI API",
    description="Türkçe konuşan kullanıcılar için AI asistan platformu",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check
@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "env": settings.ENV,
        "version": "0.1.0"
    }

# API Routes
app.include_router(auth.router, prefix="/api/v1")
app.include_router(conversations.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(places.router, prefix="/api/v1")
app.include_router(reservations.router, prefix="/api/v1")
app.include_router(pre_orders.router, prefix="/api/v1")
app.include_router(waitlist.router, prefix="/api/v1")
app.include_router(wallet.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(restaurant.router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
