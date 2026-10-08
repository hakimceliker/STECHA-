"""Optional, local-only STECHAI boundary for the Senatech Control Plane.

The default adapter has no transport. A trusted caller must inject the
transport explicitly after authentication and tenant resolution. This keeps
the existing chat, booking and payment paths unchanged by default.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Mapping
import re


PROJECT_ID = "stechai"
ALLOWED_TASKS = frozenset({"chat", "summary", "customer_reply"})
BLOCKED_ACTIONS = frozenset({"purchase", "reservation", "financial_action", "trading_action"})
REQUEST_ID_RE = re.compile(r"^[A-Za-z0-9_.:/-]{1,128}$")
TENANT_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$")


@dataclass(frozen=True)
class ControlPlaneRequest:
    task: str
    input: str
    tenant_id: str
    request_id: str
    action_type: str | None = None


@dataclass(frozen=True)
class ControlPlaneResponse:
    text: str
    provider: str
    model: str
    validated: bool
    project_id: str
    tenant_id: str
    request_id: str
    shadow_only: bool
    usage: Mapping[str, Any]


Transport = Callable[[Mapping[str, Any]], Mapping[str, Any]]


def _record(value: Any) -> Mapping[str, Any]:
    return value if isinstance(value, Mapping) else {}


def _validate_request(request: ControlPlaneRequest) -> None:
    if not isinstance(request.input, str) or not request.input.strip():
        raise ValueError("CONTROL_PLANE_INPUT_REQUIRED")
    if request.task not in ALLOWED_TASKS:
        raise ValueError("CONTROL_PLANE_TASK_NOT_ALLOWED")
    if not isinstance(request.tenant_id, str) or not TENANT_ID_RE.fullmatch(request.tenant_id):
        raise ValueError("CONTROL_PLANE_TENANT_REQUIRED")
    if not isinstance(request.request_id, str) or not REQUEST_ID_RE.fullmatch(request.request_id):
        raise ValueError("CONTROL_PLANE_INVALID_REQUEST_ID")
    if request.action_type in BLOCKED_ACTIONS:
        raise ValueError("CONTROL_PLANE_APPROVAL_REQUIRED")


class SenatechControlPlaneAdapter:
    """Explicitly injected, shadow-only adapter for the STECHAI project."""

    def __init__(self, transport: Transport | None = None) -> None:
        self._transport = transport

    @property
    def configured(self) -> bool:
        return self._transport is not None

    def execute(self, request: ControlPlaneRequest) -> ControlPlaneResponse:
        _validate_request(request)
        if self._transport is None:
            raise RuntimeError("CONTROL_PLANE_NOT_CONFIGURED")

        envelope = {
            "project_id": PROJECT_ID,
            "tenant_id": request.tenant_id,
            "request_id": request.request_id,
            "task": request.task,
            "prompt": request.input.strip(),
            "local_only": True,
            "allow_cloud": False,
            "shadow_only": True,
            "metadata": {
                "project_id": PROJECT_ID,
                "tenant_id": request.tenant_id,
                "request_id": request.request_id,
                "local_only": True,
                "allow_cloud": False,
                "shadow_only": True,
            },
        }

        try:
            response = _record(self._transport(envelope))
        except (ValueError, RuntimeError):
            raise
        except Exception as exc:  # pragma: no cover - transport boundary
            raise RuntimeError("CONTROL_PLANE_UNAVAILABLE") from exc

        if response.get("request_id", request.request_id) != request.request_id:
            raise RuntimeError("CONTROL_PLANE_REQUEST_ID_MISMATCH")

        result = _record(response.get("result"))
        usage = _record(response.get("usage"))
        text = result.get("output")
        if not isinstance(text, str) or not text.strip():
            raise RuntimeError("CONTROL_PLANE_NOT_COMPLETED")
        if result.get("validated") is not True or usage.get("state") != "completed":
            raise RuntimeError("CONTROL_PLANE_NOT_COMPLETED")

        return ControlPlaneResponse(
            text=text.strip(),
            provider=str(result.get("provider", "unknown")),
            model=str(result.get("model", "unknown")),
            validated=True,
            project_id=PROJECT_ID,
            tenant_id=request.tenant_id,
            request_id=request.request_id,
            shadow_only=True,
            usage={
                "input_tokens": usage.get("input_tokens"),
                "output_tokens": usage.get("output_tokens"),
                "total_tokens": usage.get("total_tokens"),
                "usage_basis": usage.get("usage_basis", "unknown"),
            },
        )

