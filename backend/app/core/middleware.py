"""Middleware for security and monitoring"""

import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)


class RateLimiter:
    """Rate limiting by IP and user"""

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, List[float]] = {}

    def is_allowed(self, identifier: str) -> bool:
        """Check if request is allowed"""
        now = time.time()

        if identifier not in self.requests:
            self.requests[identifier] = []

        # Remove old requests (older than 1 minute)
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier]
            if now - req_time < 60
        ]

        # Check limit
        if len(self.requests[identifier]) >= self.requests_per_minute:
            return False

        # Add current request
        self.requests[identifier].append(now)
        return True

    def cleanup(self):
        """Remove old entries"""
        now = time.time()
        for identifier in list(self.requests.keys()):
            self.requests[identifier] = [
                req_time for req_time in self.requests[identifier]
                if now - req_time < 3600
            ]
            if not self.requests[identifier]:
                del self.requests[identifier]


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware"""

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.limiter = RateLimiter(requests_per_minute)
        self.cleanup_interval = 300  # Cleanup every 5 minutes
        self.last_cleanup = time.time()

    async def dispatch(self, request: Request, call_next):
        # Get identifier (IP or user)
        client_ip = request.client.host if request.client else "unknown"

        # Check auth for user-based limiting
        identifier = f"ip:{client_ip}"
        try:
            auth_header = request.headers.get("authorization", "")
            if auth_header.startswith("Bearer "):
                identifier = f"user:{auth_header[7:]}"
        except:
            pass

        # Check rate limit
        if not self.limiter.is_allowed(identifier):
            logger.warning(f"Rate limit exceeded for {identifier}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Try again later."}
            )

        # Cleanup periodically
        if time.time() - self.last_cleanup > self.cleanup_interval:
            self.limiter.cleanup()
            self.last_cleanup = time.time()

        response = await call_next(request)
        return response


class AuditLogger:
    """Audit logging for operations"""

    def __init__(self):
        self.logs: List[dict] = []

    def log_operation(
        self,
        user_id: int,
        action: str,
        resource: str,
        resource_id: int,
        status: str,
        details: dict = None
    ):
        """Log an operation"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "resource_id": resource_id,
            "status": status,
            "details": details or {}
        }

        self.logs.append(log_entry)

        logger.info(
            f"[AUDIT] User {user_id}: {action} {resource}:{resource_id} - {status}"
        )

    def log_login(self, user_id: int, ip_address: str, success: bool):
        """Log login attempt"""
        self.log_operation(
            user_id=user_id,
            action="login",
            resource="auth",
            resource_id=user_id,
            status="success" if success else "failed",
            details={"ip_address": ip_address}
        )

    def log_data_access(self, user_id: int, resource: str, resource_id: int):
        """Log data access"""
        self.log_operation(
            user_id=user_id,
            action="read",
            resource=resource,
            resource_id=resource_id,
            status="success"
        )

    def log_data_modification(
        self,
        user_id: int,
        action: str,
        resource: str,
        resource_id: int,
        changes: dict
    ):
        """Log data modification"""
        self.log_operation(
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            status="success",
            details={"changes": changes}
        )

    def get_logs(self, user_id: int = None, limit: int = 100) -> List[dict]:
        """Get audit logs"""
        logs = self.logs

        if user_id:
            logs = [log for log in logs if log["user_id"] == user_id]

        return logs[-limit:]


class AuditMiddleware(BaseHTTPMiddleware):
    """Audit logging middleware"""

    def __init__(self, app, audit_logger: AuditLogger):
        super().__init__(app)
        self.audit_logger = audit_logger

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        response = await call_next(request)

        # Log audit trail for mutations
        if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
            try:
                auth_header = request.headers.get("authorization", "")
                user_id = 0
                if auth_header.startswith("Bearer "):
                    # In production: decode JWT to get user_id
                    user_id = 1

                self.audit_logger.log_operation(
                    user_id=user_id,
                    action=request.method.lower(),
                    resource=request.url.path.split("/")[-1],
                    resource_id=0,
                    status="success" if response.status_code < 400 else "failed",
                    details={
                        "method": request.method,
                        "path": request.url.path,
                        "status_code": response.status_code,
                        "duration_ms": int((time.time() - start_time) * 1000)
                    }
                )
            except:
                pass

        return response


# Global instances
audit_logger = AuditLogger()
rate_limiter = RateLimiter(requests_per_minute=100)
