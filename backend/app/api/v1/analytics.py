"""Analytics API Endpoints"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.db.base import User
from app.services.analytics import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=Dict[str, Any])
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's analytics dashboard"""
    return AnalyticsService.get_user_dashboard(db, current_user.id)


@router.get("/usage-summary", response_model=Dict[str, Any])
async def get_usage_summary(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get usage summary for specified period"""
    if days < 1 or days > 365:
        raise HTTPException(status_code=400, detail="Days must be between 1 and 365")

    return AnalyticsService.get_usage_summary(db, current_user.id, days)


@router.get("/conversation/{conversation_id}/analytics", response_model=Dict[str, Any])
async def get_conversation_analytics(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get detailed analytics for a specific conversation"""
    analytics = AnalyticsService.get_conversation_analytics(db, conversation_id, current_user.id)
    if not analytics:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return analytics


@router.get("/metrics/summary", response_model=Dict[str, Any])
async def get_metrics_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get summary of key metrics"""
    dashboard_data = AnalyticsService.get_user_dashboard(db, current_user.id)

    return {
        "total_conversations": dashboard_data["total_conversations"],
        "total_messages": dashboard_data["total_messages"],
        "total_tokens_used": dashboard_data["total_tokens_used"],
        "total_cost_usd": dashboard_data["total_cost_usd"],
        "total_api_calls": dashboard_data["total_api_calls"],
        "average_response_time_ms": dashboard_data["average_response_time_ms"],
        "last_active_at": dashboard_data["last_active_at"],
    }
