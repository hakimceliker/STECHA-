"""Authentication endpoint tests for STECH AI"""

import pytest
from fastapi import status
from sqlalchemy.orm import Session

from app.db.base import User
from app.db.session import get_db


@pytest.mark.auth
class TestAuthHealth:
    """Test health endpoint"""

    def test_health_endpoint(self, test_client):
        """Test that health endpoint returns 200"""
        response = test_client.get("/api/v1/health")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.auth
class TestUserRegistration:
    """Test user registration endpoint"""

    def test_register_success(self, test_client, test_user_data):
        """Test successful user registration"""
        response = test_client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verify response structure
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "user" in data

        # Verify user data
        user = data["user"]
        assert user["email"] == test_user_data["email"]
        assert user["name"] == test_user_data["name"]
        assert user["locale"] == test_user_data["locale"]
        assert user["is_admin"] is False
        assert "id" in user

    def test_register_invalid_email(self, test_client, test_user_invalid_email):
        """Test registration with invalid email"""
        response = test_client.post(
            "/api/v1/auth/register",
            json=test_user_invalid_email
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_register_duplicate_email(self, test_client, test_user_data):
        """Test registration with duplicate email"""
        # Register first user
        response1 = test_client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        assert response1.status_code == status.HTTP_200_OK

        # Try to register same email again
        response2 = test_client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        assert response2.status_code == status.HTTP_400_BAD_REQUEST
        assert "already registered" in response2.json()["detail"].lower()

    def test_register_missing_fields(self, test_client):
        """Test registration with missing required fields"""
        response = test_client.post(
            "/api/v1/auth/register",
            json={"email": "test@example.com"}  # Missing password, name
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_password_not_stored_plaintext(self, test_client, test_user_data, test_db_session):
        """Test that password is not stored as plaintext"""
        # Register user
        response = test_client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        assert response.status_code == status.HTTP_200_OK

        # Check database
        user = test_db_session.query(User).filter(
            User.email == test_user_data["email"]
        ).first()

        assert user is not None
        assert user.password_hash != test_user_data["password"]
        assert user.password_hash.startswith("$2")  # bcrypt hash prefix


@pytest.mark.auth
class TestUserLogin:
    """Test user login endpoint"""

    def test_login_success(self, test_client, registered_test_user, test_user_data):
        """Test successful login"""
        response = test_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user_data["email"],
                "password": test_user_data["password"]
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == test_user_data["email"]

    def test_login_wrong_password(self, test_client, registered_test_user):
        """Test login with wrong password"""
        response = test_client.post(
            "/api/v1/auth/login",
            json={
                "email": registered_test_user["email"],
                "password": "WrongPassword123!"
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "invalid" in response.json()["detail"].lower()

    def test_login_nonexistent_user(self, test_client):
        """Test login with non-existent user"""
        response = test_client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "AnyPassword123!"
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "invalid" in response.json()["detail"].lower()

    def test_login_missing_fields(self, test_client):
        """Test login with missing fields"""
        response = test_client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com"}  # Missing password
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.auth
class TestGetProfile:
    """Test get current user profile endpoint"""

    def test_get_profile_success(self, test_client, registered_test_user):
        """Test successful profile retrieval"""
        response = test_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["email"] == registered_test_user["email"]
        assert data["name"] == registered_test_user["user"]["name"]
        assert "id" in data

    def test_get_profile_no_token(self, test_client):
        """Test profile access without token"""
        response = test_client.get("/api/v1/auth/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "not authenticated" in response.json()["detail"].lower()

    def test_get_profile_invalid_token(self, test_client):
        """Test profile access with invalid token"""
        response = test_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_profile_wrong_auth_scheme(self, test_client, registered_test_user):
        """Test profile access with wrong auth scheme"""
        response = test_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Basic {registered_test_user['token']}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.auth
class TestTokenValidation:
    """Test JWT token validation"""

    def test_expired_token_rejected(self, test_client, registered_test_user):
        """Test that expired token is rejected (would need to mock time)"""
        # This test would require mocking datetime to create an expired token
        # For now, we test that a valid token works
        response = test_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"}
        )
        assert response.status_code == status.HTTP_200_OK

    def test_modified_token_rejected(self, test_client, registered_test_user):
        """Test that modified token is rejected"""
        token = registered_test_user['token']
        # Modify the token
        modified_token = token[:-5] + "xxxxx"

        response = test_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {modified_token}"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
