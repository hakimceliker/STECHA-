from app.services.senatech_control_plane_adapter import (
    PROJECT_ID,
    ControlPlaneRequest,
    SenatechControlPlaneAdapter,
)


def _request(**overrides):
    values = {
        "task": "summary",
        "input": "Summarize the approved local task.",
        "tenant_id": "tenant-demo",
        "request_id": "stechai-test-001",
    }
    values.update(overrides)
    return ControlPlaneRequest(**values)


def test_adapter_binds_project_tenant_request_and_shadow_flags():
    received = {}

    def transport(envelope):
        received.update(envelope)
        return {
            "request_id": "stechai-test-001",
            "result": {"output": "validated summary", "provider": "local", "model": "mock", "validated": True},
            "usage": {"state": "completed", "usage_basis": "test", "total_tokens": 7},
        }

    result = SenatechControlPlaneAdapter(transport).execute(_request())

    assert received["project_id"] == PROJECT_ID
    assert received["tenant_id"] == "tenant-demo"
    assert received["request_id"] == "stechai-test-001"
    assert received["local_only"] is True
    assert received["allow_cloud"] is False
    assert received["shadow_only"] is True
    assert result.project_id == PROJECT_ID
    assert result.shadow_only is True


def test_adapter_fails_closed_without_explicit_transport():
    adapter = SenatechControlPlaneAdapter()

    try:
        adapter.execute(_request())
    except RuntimeError as error:
        assert str(error) == "CONTROL_PLANE_NOT_CONFIGURED"
    else:
        raise AssertionError("adapter must fail closed without transport")


def test_adapter_rejects_identity_and_approval_failures_before_transport():
    calls = []

    def transport(envelope):
        calls.append(envelope)
        return {}

    adapter = SenatechControlPlaneAdapter(transport)
    failures = [
        (_request(tenant_id="bad tenant"), "CONTROL_PLANE_TENANT_REQUIRED"),
        (_request(request_id="bad id!"), "CONTROL_PLANE_INVALID_REQUEST_ID"),
        (_request(action_type="reservation"), "CONTROL_PLANE_APPROVAL_REQUIRED"),
        (_request(task="unknown"), "CONTROL_PLANE_TASK_NOT_ALLOWED"),
    ]

    for request, expected in failures:
        try:
            adapter.execute(request)
        except ValueError as error:
            assert str(error) == expected
        else:
            raise AssertionError(f"expected {expected}")

    assert calls == []


def test_adapter_rejects_mismatched_or_incomplete_response():
    mismatched = SenatechControlPlaneAdapter(lambda _: {"request_id": "other"})
    try:
        mismatched.execute(_request())
    except RuntimeError as error:
        assert str(error) == "CONTROL_PLANE_REQUEST_ID_MISMATCH"
    else:
        raise AssertionError("mismatched request id must fail closed")

    incomplete = SenatechControlPlaneAdapter(lambda _: {
        "request_id": "stechai-test-001",
        "result": {"output": "", "validated": False},
        "usage": {"state": "pending"},
    })
    try:
        incomplete.execute(_request())
    except RuntimeError as error:
        assert str(error) == "CONTROL_PLANE_NOT_COMPLETED"
    else:
        raise AssertionError("incomplete response must fail closed")

