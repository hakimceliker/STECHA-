"""Analytics and Usage Tracking Service"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.db.base import UsageEvent, ConversationMetrics, UserMetrics, Conversation, ConversationMessage


class AnalyticsService:
    """Service for tracking and analyzing user metrics"""

    @staticmethod
    def record_usage_event(
        db: Session,
        user_id: int,
        event_type: str,
        conversation_id: Optional[int] = None,
        provider: str = "openai",
        tokens_in: int = 0,
        tokens_out: int = 0,
        cost_usd: float = 0.0,
        response_time_ms: Optional[int] = None,
        status: str = "success",
        error_message: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> UsageEvent:
        """Record a usage event"""
        event = UsageEvent(
            user_id=user_id,
            conversation_id=conversation_id,
            event_type=event_type,
            provider=provider,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            cost_usd=cost_usd,
            response_time_ms=response_time_ms,
            status=status,
            error_message=error_message,
            event_metadata=metadata or {},
        )
        db.add(event)
        db.commit()
        return event

    @staticmethod
    def update_conversation_metrics(db: Session, conversation_id: int, user_id: int) -> ConversationMetrics:
        """Update metrics for a conversation"""
        # Get or create metrics
        metrics = db.query(ConversationMetrics).filter_by(conversation_id=conversation_id).first()

        if not metrics:
            conversation = db.query(Conversation).filter_by(id=conversation_id).first()
            if not conversation:
                raise ValueError(f"Conversation {conversation_id} not found")

            metrics = ConversationMetrics(
                conversation_id=conversation_id,
                user_id=user_id,
                started_at=conversation.created_at,
                last_activity_at=conversation.created_at,
            )
            db.add(metrics)

        # Aggregate message data
        messages = db.query(ConversationMessage).filter_by(conversation_id=conversation_id).all()

        metrics.message_count = len(messages)
        metrics.total_tokens_in = sum(m.tokens_in for m in messages)
        metrics.total_tokens_out = sum(m.tokens_out for m in messages)
        metrics.total_cost_usd = sum(m.cost_usd for m in messages)
        metrics.longest_message_tokens = max((m.tokens_in + m.tokens_out for m in messages), default=0)

        # Calculate provider usage
        providers_count = {}
        for msg in messages:
            provider = msg.provider or "openai"
            providers_count[provider] = providers_count.get(provider, 0) + 1
        metrics.providers_used = providers_count

        # Calculate average response time
        response_times = [m.tokens_out for m in messages if m.tokens_out > 0]
        if response_times:
            metrics.average_response_time_ms = int(sum(response_times) / len(response_times))

        metrics.last_activity_at = datetime.utcnow()
        db.commit()
        return metrics

    @staticmethod
    def update_user_metrics(db: Session, user_id: int) -> UserMetrics:
        """Update aggregated metrics for a user"""
        # Get or create user metrics
        metrics = db.query(UserMetrics).filter_by(user_id=user_id).first()

        if not metrics:
            metrics = UserMetrics(
                user_id=user_id,
                last_active_at=datetime.utcnow(),
            )
            db.add(metrics)

        # Get user's conversations
        conversations = db.query(Conversation).filter_by(user_id=user_id).all()
        metrics.total_conversations = len(conversations)

        # Aggregate usage events
        usage_events = db.query(UsageEvent).filter_by(user_id=user_id).all()
        metrics.total_api_calls = len(usage_events)
        metrics.total_tokens_used = sum(e.tokens_in + e.tokens_out for e in usage_events)
        metrics.total_cost_usd = sum(e.cost_usd for e in usage_events)

        # Calculate average response time
        response_times = [e.response_time_ms for e in usage_events if e.response_time_ms]
        if response_times:
            metrics.average_response_time_ms = int(sum(response_times) / len(response_times))

        # Aggregate messages
        all_messages = db.query(ConversationMessage).filter_by(user_id=user_id).all()
        metrics.total_messages = len(all_messages)

        metrics.last_active_at = datetime.utcnow()
        db.commit()
        return metrics

    @staticmethod
    def get_user_dashboard(db: Session, user_id: int) -> Dict[str, Any]:
        """Get comprehensive dashboard data for user"""
        metrics = db.query(UserMetrics).filter_by(user_id=user_id).first()

        if not metrics:
            return {
                "total_conversations": 0,
                "total_messages": 0,
                "total_tokens_used": 0,
                "total_cost_usd": 0.0,
                "total_api_calls": 0,
                "average_response_time_ms": None,
                "last_active_at": None,
                "recent_activity": [],
                "daily_usage": [],
            }

        # Get recent activity (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_usage = (
            db.query(UsageEvent)
            .filter(
                and_(
                    UsageEvent.user_id == user_id,
                    UsageEvent.created_at >= week_ago,
                )
            )
            .order_by(UsageEvent.created_at.desc())
            .limit(20)
            .all()
        )

        # Calculate daily usage
        daily_usage = (
            db.query(
                func.date(UsageEvent.created_at).label("date"),
                func.count(UsageEvent.id).label("count"),
                func.sum(UsageEvent.tokens_in).label("tokens_in"),
                func.sum(UsageEvent.tokens_out).label("tokens_out"),
                func.sum(UsageEvent.cost_usd).label("cost"),
            )
            .filter(
                and_(
                    UsageEvent.user_id == user_id,
                    UsageEvent.created_at >= week_ago,
                )
            )
            .group_by(func.date(UsageEvent.created_at))
            .order_by(func.date(UsageEvent.created_at))
            .all()
        )

        return {
            "total_conversations": metrics.total_conversations,
            "total_messages": metrics.total_messages,
            "total_tokens_used": metrics.total_tokens_used,
            "total_cost_usd": round(metrics.total_cost_usd, 4),
            "total_api_calls": metrics.total_api_calls,
            "average_response_time_ms": metrics.average_response_time_ms,
            "last_active_at": metrics.last_active_at.isoformat() if metrics.last_active_at else None,
            "recent_activity": [
                {
                    "event_type": e.event_type,
                    "provider": e.provider,
                    "tokens": e.tokens_in + e.tokens_out,
                    "cost_usd": round(e.cost_usd, 4),
                    "status": e.status,
                    "created_at": e.created_at.isoformat(),
                }
                for e in recent_usage
            ],
            "daily_usage": [
                {
                    "date": str(d.date),
                    "api_calls": d.count,
                    "tokens_in": d.tokens_in or 0,
                    "tokens_out": d.tokens_out or 0,
                    "cost_usd": round(d.cost or 0.0, 4),
                }
                for d in daily_usage
            ],
        }

    @staticmethod
    def get_conversation_analytics(db: Session, conversation_id: int, user_id: int) -> Dict[str, Any]:
        """Get detailed analytics for a conversation"""
        metrics = db.query(ConversationMetrics).filter_by(
            conversation_id=conversation_id,
            user_id=user_id,
        ).first()

        if not metrics:
            return {}

        messages = db.query(ConversationMessage).filter_by(conversation_id=conversation_id).all()

        return {
            "conversation_id": conversation_id,
            "message_count": metrics.message_count,
            "total_tokens_in": metrics.total_tokens_in,
            "total_tokens_out": metrics.total_tokens_out,
            "total_cost_usd": round(metrics.total_cost_usd, 4),
            "average_response_time_ms": metrics.average_response_time_ms,
            "longest_message_tokens": metrics.longest_message_tokens,
            "providers_used": metrics.providers_used,
            "started_at": metrics.started_at.isoformat(),
            "last_activity_at": metrics.last_activity_at.isoformat(),
            "ended_at": metrics.ended_at.isoformat() if metrics.ended_at else None,
            "message_breakdown": [
                {
                    "role": m.role,
                    "provider": m.provider,
                    "tokens_in": m.tokens_in,
                    "tokens_out": m.tokens_out,
                    "cost_usd": round(m.cost_usd, 4),
                    "created_at": m.created_at.isoformat(),
                }
                for m in messages
            ],
        }

    @staticmethod
    def get_usage_summary(db: Session, user_id: int, days: int = 30) -> Dict[str, Any]:
        """Get usage summary for a time period"""
        start_date = datetime.utcnow() - timedelta(days=days)

        events = (
            db.query(UsageEvent)
            .filter(
                and_(
                    UsageEvent.user_id == user_id,
                    UsageEvent.created_at >= start_date,
                )
            )
            .all()
        )

        if not events:
            return {
                "period_days": days,
                "total_api_calls": 0,
                "total_tokens": 0,
                "total_cost_usd": 0.0,
                "success_rate": 0.0,
                "by_provider": {},
                "by_event_type": {},
            }

        success_count = sum(1 for e in events if e.status == "success")

        by_provider = {}
        by_event_type = {}

        for event in events:
            # By provider
            if event.provider not in by_provider:
                by_provider[event.provider] = {
                    "calls": 0,
                    "tokens": 0,
                    "cost_usd": 0.0,
                }
            by_provider[event.provider]["calls"] += 1
            by_provider[event.provider]["tokens"] += event.tokens_in + event.tokens_out
            by_provider[event.provider]["cost_usd"] += event.cost_usd

            # By event type
            if event.event_type not in by_event_type:
                by_event_type[event.event_type] = {
                    "count": 0,
                    "tokens": 0,
                    "cost_usd": 0.0,
                }
            by_event_type[event.event_type]["count"] += 1
            by_event_type[event.event_type]["tokens"] += event.tokens_in + event.tokens_out
            by_event_type[event.event_type]["cost_usd"] += event.cost_usd

        return {
            "period_days": days,
            "total_api_calls": len(events),
            "total_tokens": sum(e.tokens_in + e.tokens_out for e in events),
            "total_cost_usd": round(sum(e.cost_usd for e in events), 4),
            "success_rate": round((success_count / len(events) * 100) if events else 0, 2),
            "by_provider": {
                k: {
                    "calls": v["calls"],
                    "tokens": v["tokens"],
                    "cost_usd": round(v["cost_usd"], 4),
                }
                for k, v in by_provider.items()
            },
            "by_event_type": {
                k: {
                    "count": v["count"],
                    "tokens": v["tokens"],
                    "cost_usd": round(v["cost_usd"], 4),
                }
                for k, v in by_event_type.items()
            },
        }
