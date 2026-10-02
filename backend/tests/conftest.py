"""Pytest configuration and fixtures for STECH AI backend tests"""

import os
import tempfile
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.api.v1.auth import hash_password


@pytest.fixture(scope="session")
def test_db_path():
    """Create a temporary test database file"""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    yield path
    # Cleanup
    if os.path.exists(path):
        os.remove(path)


@pytest.fixture(scope="session")
def test_db_engine(test_db_path):
    """Create test database engine"""
    DATABASE_URL = f"sqlite:///{test_db_path}"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture(scope="function")
def test_db_session(test_db_engine) -> Generator[Session, None, None]:
    """Create test database session with cleanup"""
    connection = test_db_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(autocommit=False, autoflush=False, bind=connection)()

    # Override get_db dependency
    def override_get_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    yield session

    # Cleanup
    session.close()
    transaction.rollback()
    connection.close()
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_client(test_db_session) -> TestClient:
    """Create test client"""
    return TestClient(app)


@pytest.fixture(scope="function")
def test_user_data():
    """Test user data"""
    return {
        "email": "testuser@example.com",
        "password": "TestPassword123!",
        "name": "Test User",
        "locale": "tr"
    }


@pytest.fixture(scope="function")
def test_user_weak_password():
    """Test user with weak password"""
    return {
        "email": "weakpass@example.com",
        "password": "weak",
        "name": "Weak Pass User",
        "locale": "tr"
    }


@pytest.fixture(scope="function")
def test_user_invalid_email():
    """Test user with invalid email"""
    return {
        "email": "not-an-email",
        "password": "ValidPassword123!",
        "name": "Invalid Email User",
        "locale": "tr"
    }


@pytest.fixture(scope="function")
def registered_test_user(test_client, test_user_data):
    """Register a test user and return token"""
    response = test_client.post(
        "/api/v1/auth/register",
        json=test_user_data
    )
    assert response.status_code == 200
    data = response.json()
    return {
        "token": data["access_token"],
        "user": data["user"],
        "email": test_user_data["email"],
        "password": test_user_data["password"]
    }


@pytest.fixture(scope="function")
def test_business(test_db_session):
    """Create a test business"""
    from app.db.base import Business
    from datetime import datetime

    business = Business(
        owner_id=1,
        type="restaurant",
        name="Test Restaurant",
        address="123 Main St",
        phone="555-0123",
        email="restaurant@example.com",
        description="A test restaurant",
        coordinates={"lat": 40.7128, "lng": -74.0060},
        tax_no="12345678",
        daily_capacity=100,
        status="active",
        commission_rate=0.1,
        created_at=datetime.utcnow()
    )
    test_db_session.add(business)
    test_db_session.commit()
    test_db_session.refresh(business)
    return business
