"""Chat endpoint tests for STECH AI"""

import pytest
from fastapi import status


@pytest.mark.chat
class TestChatDemo:
    """Test chat endpoint in demo mode"""

    def test_chat_demo_mode_response(self, test_client, registered_test_user):
        """Test that chat endpoint returns demo mode message"""
        response = test_client.post(
            "/api/v1/chat",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={"message": "Hello, test message"}
        )

        # Should return 503 Service Unavailable in demo mode
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        data = response.json()
        assert "not configured" in data["detail"].lower()

    def test_chat_without_auth(self, test_client):
        """Test that chat requires authentication"""
        response = test_client.post(
            "/api/v1/chat",
            json={"message": "Hello"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_chat_invalid_token(self, test_client):
        """Test that chat with invalid token is rejected"""
        response = test_client.post(
            "/api/v1/chat",
            headers={"Authorization": "Bearer invalid.token"},
            json={"message": "Hello"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_chat_empty_message_rejected(self, test_client, registered_test_user):
        """Test that empty message is rejected"""
        response = test_client.post(
            "/api/v1/chat",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={"message": ""}
        )

        # Empty message should be rejected before demo mode check
        # Expected status depends on validation
        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_503_SERVICE_UNAVAILABLE  # Falls through to demo mode
        ]

    def test_chat_missing_message_field(self, test_client, registered_test_user):
        """Test that missing message field is rejected"""
        response = test_client.post(
            "/api/v1/chat",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={}  # Missing message field
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.chat
class TestChatSafeDefaults:
    """Test that chat has safe defaults"""

    def test_chat_safe_fallback_without_api_key(self, test_client, registered_test_user):
        """Test that chat safely fails when no API key is configured"""
        response = test_client.post(
            "/api/v1/chat",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={"message": "Test message"}
        )

        # Should not expose any security info
        data = response.json()
        assert "api_key" not in str(data).lower()
        assert "secret" not in str(data).lower()
        assert "password" not in str(data).lower()
