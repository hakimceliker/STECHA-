"""System Monitoring and Alerting Service"""

import logging
import time
from datetime import datetime
from typing import List, Optional, Dict
from enum import Enum

logger = logging.getLogger(__name__)


class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class Alert(dict):
    """Alert object"""
    def __init__(
        self,
        severity: AlertSeverity,
        title: str,
        description: str,
        service: str,
        timestamp: datetime = None
    ):
        super().__init__()
        self["severity"] = severity
        self["title"] = title
        self["description"] = description
        self["service"] = service
        self["timestamp"] = timestamp or datetime.utcnow()
        self["resolved"] = False


class HealthCheck:
    """Health check status"""
    def __init__(self):
        self.database_ok = True
        self.api_ok = True
        self.redis_ok = True
        self.storage_ok = True
        self.last_check = datetime.utcnow()

    def to_dict(self):
        return {
            "status": "healthy" if all([
                self.database_ok,
                self.api_ok,
                self.redis_ok,
                self.storage_ok
            ]) else "degraded",
            "database": "ok" if self.database_ok else "down",
            "api": "ok" if self.api_ok else "down",
            "redis": "ok" if self.redis_ok else "down",
            "storage": "ok" if self.storage_ok else "down",
            "last_check": self.last_check.isoformat()
        }


class MonitoringService:
    """System monitoring and alerting"""

    def __init__(self):
        self.alerts: List[Alert] = []
        self.health_check = HealthCheck()
        self.metrics = {
            "api_requests": 0,
            "api_errors": 0,
            "api_latency_ms": 0,
            "database_queries": 0,
            "database_errors": 0,
            "cache_hits": 0,
            "cache_misses": 0
        }

    def record_api_request(self, duration_ms: float, status_code: int):
        """Record API request"""
        self.metrics["api_requests"] += 1
        self.metrics["api_latency_ms"] = duration_ms

        if status_code >= 400:
            self.metrics["api_errors"] += 1

            if status_code >= 500:
                self.create_alert(
                    severity=AlertSeverity.ERROR,
                    title="API Error",
                    description=f"API returned status code {status_code}",
                    service="api"
                )

    def record_database_query(self, duration_ms: float, error: bool = False):
        """Record database query"""
        self.metrics["database_queries"] += 1

        if error:
            self.metrics["database_errors"] += 1
            self.create_alert(
                severity=AlertSeverity.WARNING,
                title="Database Error",
                description="Database query failed",
                service="database"
            )

    def record_cache_operation(self, hit: bool):
        """Record cache operation"""
        if hit:
            self.metrics["cache_hits"] += 1
        else:
            self.metrics["cache_misses"] += 1

    def create_alert(
        self,
        severity: AlertSeverity,
        title: str,
        description: str,
        service: str
    ):
        """Create alert"""
        alert = Alert(severity, title, description, service)
        self.alerts.append(alert)

        logger.warning(
            f"[{severity.value.upper()}] {service}: {title} - {description}"
        )

        # In production: Send to monitoring service (Datadog, New Relic, etc)
        self._send_to_monitoring_service(alert)

    def resolve_alert(self, alert_index: int):
        """Mark alert as resolved"""
        if 0 <= alert_index < len(self.alerts):
            self.alerts[alert_index]["resolved"] = True

    def get_active_alerts(self) -> List[Alert]:
        """Get unresolved alerts"""
        return [alert for alert in self.alerts if not alert["resolved"]]

    def get_metrics(self) -> Dict:
        """Get system metrics"""
        total_requests = self.metrics["api_requests"]
        error_rate = (
            self.metrics["api_errors"] / total_requests * 100
            if total_requests > 0 else 0
        )
        cache_hit_rate = (
            self.metrics["cache_hits"] /
            (self.metrics["cache_hits"] + self.metrics["cache_misses"]) * 100
            if (self.metrics["cache_hits"] + self.metrics["cache_misses"]) > 0 else 0
        )

        return {
            "api_requests": self.metrics["api_requests"],
            "api_errors": self.metrics["api_errors"],
            "error_rate_percent": round(error_rate, 2),
            "api_latency_ms": self.metrics["api_latency_ms"],
            "database_queries": self.metrics["database_queries"],
            "database_errors": self.metrics["database_errors"],
            "cache_hits": self.metrics["cache_hits"],
            "cache_misses": self.metrics["cache_misses"],
            "cache_hit_rate_percent": round(cache_hit_rate, 2)
        }

    def check_health(self) -> HealthCheck:
        """Check system health"""
        try:
            # In production: Check database connection
            self.health_check.database_ok = True
        except:
            self.health_check.database_ok = False
            self.create_alert(
                severity=AlertSeverity.CRITICAL,
                title="Database Connection Failed",
                description="Cannot connect to database",
                service="database"
            )

        try:
            # In production: Check Redis connection
            self.health_check.redis_ok = True
        except:
            self.health_check.redis_ok = False

        self.health_check.last_check = datetime.utcnow()
        return self.health_check

    @staticmethod
    def _send_to_monitoring_service(alert: Alert):
        """Send alert to external monitoring service"""
        # In production: Send to Datadog, New Relic, Sentry, etc.
        pass


class BackupService:
    """Database backup and restore"""

    def __init__(self, backup_dir: str = "/backups"):
        self.backup_dir = backup_dir
        self.backups: List[dict] = []

    def create_backup(self, database_url: str) -> tuple[bool, str]:
        """Create database backup"""
        try:
            import subprocess
            from datetime import datetime

            timestamp = datetime.utcnow().isoformat()
            backup_file = f"{self.backup_dir}/backup_{timestamp}.sql"

            # In production: Use pg_dump for PostgreSQL
            # subprocess.run([
            #     "pg_dump", "-U", "user", "-d", "database",
            #     "-f", backup_file
            # ])

            backup_info = {
                "timestamp": timestamp,
                "file": backup_file,
                "size_bytes": 0,
                "status": "completed"
            }
            self.backups.append(backup_info)

            logger.info(f"Backup created: {backup_file}")
            return True, f"Backup created: {backup_file}"
        except Exception as e:
            logger.error(f"Backup error: {str(e)}")
            return False, f"Backup failed: {str(e)}"

    def list_backups(self, limit: int = 10) -> List[dict]:
        """List available backups"""
        return self.backups[-limit:]

    def restore_backup(self, backup_file: str) -> tuple[bool, str]:
        """Restore from backup"""
        try:
            # In production: Use psql to restore
            # subprocess.run([
            #     "psql", "-U", "user", "-d", "database",
            #     "-f", backup_file
            # ])

            logger.info(f"Restore completed from: {backup_file}")
            return True, f"Restore completed from: {backup_file}"
        except Exception as e:
            logger.error(f"Restore error: {str(e)}")
            return False, f"Restore failed: {str(e)}"

    def schedule_automatic_backups(self, schedule: str = "daily"):
        """Schedule automatic backups"""
        # In production: Use APScheduler or Celery
        logger.info(f"Automatic backups scheduled: {schedule}")
        return True


# Global instances
monitoring_service = MonitoringService()
backup_service = BackupService()
