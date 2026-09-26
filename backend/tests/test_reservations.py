"""Reservations endpoint tests for STECH AI"""

import pytest
from fastapi import status
from datetime import datetime, timedelta


@pytest.mark.reservations
class TestReservationsCreate:
    """Test reservation creation"""

    def test_create_reservation_success(self, test_client, registered_test_user, test_business):
        """Test successful reservation creation"""
        future_date = (datetime.utcnow() + timedelta(days=7)).isoformat()

        response = test_client.post(
            "/api/v1/reservations",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "reservation_date": future_date,
                "guest_count": 4,
                "special_requests": "Window table please"
            }
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["business_id"] == test_business.id
        assert data["guest_count"] == 4
        assert data["status"] == "pending"
        assert data["special_requests"] == "Window table please"

    def test_create_reservation_past_date(self, test_client, registered_test_user, test_business):
        """Test that past date is rejected"""
        past_date = (datetime.utcnow() - timedelta(days=1)).isoformat()

        response = test_client.post(
            "/api/v1/reservations",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "reservation_date": past_date,
                "guest_count": 2
            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "past" in response.json()["detail"].lower()

    def test_create_reservation_invalid_guest_count(self, test_client, registered_test_user, test_business):
        """Test that invalid guest count is rejected"""
        future_date = (datetime.utcnow() + timedelta(days=7)).isoformat()

        response = test_client.post(
            "/api/v1/reservations",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "reservation_date": future_date,
                "guest_count": 200  # Exceeds daily capacity of 100
            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "guest count" in response.json()["detail"].lower()

    def test_create_reservation_zero_guests(self, test_client, registered_test_user, test_business):
        """Test that zero guests is rejected"""
        future_date = (datetime.utcnow() + timedelta(days=7)).isoformat()

        response = test_client.post(
            "/api/v1/reservations",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "reservation_date": future_date,
                "guest_count": 0
            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_reservation_nonexistent_business(self, test_client, registered_test_user):
        """Test that nonexistent business is rejected"""
        future_date = (datetime.utcnow() + timedelta(days=7)).isoformat()

        response = test_client.post(
            "/api/v1/reservations",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": 9999,
                "reservation_date": future_date,
                "guest_count": 2
            }
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_reservation_requires_auth(self, test_client, test_business):
        """Test that reservation creation requires authentication"""
        future_date = (datetime.utcnow() + timedelta(days=7)).isoformat()

        response = test_client.post(
            "/api/v1/reservations",
            json={
                "business_id": test_business.id,
                "reservation_date": future_date,
                "guest_count": 2
            }
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.reservations
class TestReservationsRead:
    """Test reservation reading"""

    def test_list_reservations(self, test_client, registered_test_user, test_business):
        """Test listing reservations"""
        future_date = (datetime.utcnow() + timedelta(days=7)).isoformat()

        # Create a reservation first
        test_client.post(
            "/api/v1/reservations",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "reservation_date": future_date,
                "guest_count": 2
            }
        )

        response = test_client.get(
            "/api/v1/reservations",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1

    def test_get_specific_reservation(self, test_client, registered_test_user, test_business):
        """Test getting a specific reservation"""
        future_date = (datetime.utcnow() + timedelta(days=7)).isoformat()

        # Create a reservation
        create_response = test_client.post(
            "/api/v1/reservations",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "reservation_date": future_date,
                "guest_count": 3
            }
        )

        reservation_id = create_response.json()["id"]

        response = test_client.get(
            f"/api/v1/reservations/{reservation_id}",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == reservation_id
        assert data["guest_count"] == 3

    def test_get_nonexistent_reservation(self, test_client, registered_test_user):
        """Test getting nonexistent reservation"""
        response = test_client.get(
            "/api/v1/reservations/9999",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"}
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.reservations
class TestReservationsUpdate:
    """Test reservation updates"""

    def test_update_reservation_guest_count(self, test_client, registered_test_user, test_business):
        """Test updating guest count"""
        future_date = (datetime.utcnow() + timedelta(days=7)).isoformat()

        # Create a reservation
        create_response = test_client.post(
            "/api/v1/reservations",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "reservation_date": future_date,
                "guest_count": 2
            }
        )

        reservation_id = create_response.json()["id"]

        response = test_client.patch(
            f"/api/v1/reservations/{reservation_id}",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={"guest_count": 4}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["guest_count"] == 4

    def test_update_reservation_date(self, test_client, registered_test_user, test_business):
        """Test updating reservation date"""
        future_date = (datetime.utcnow() + timedelta(days=7)).isoformat()
        new_date = (datetime.utcnow() + timedelta(days=14)).isoformat()

        # Create a reservation
        create_response = test_client.post(
            "/api/v1/reservations",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "reservation_date": future_date,
                "guest_count": 2
            }
        )

        reservation_id = create_response.json()["id"]

        response = test_client.patch(
            f"/api/v1/reservations/{reservation_id}",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={"reservation_date": new_date}
        )

        assert response.status_code == status.HTTP_200_OK


@pytest.mark.reservations
class TestReservationsCancellation:
    """Test reservation cancellation"""

    def test_cancel_reservation(self, test_client, registered_test_user, test_business):
        """Test cancelling a reservation"""
        future_date = (datetime.utcnow() + timedelta(days=7)).isoformat()

        # Create a reservation
        create_response = test_client.post(
            "/api/v1/reservations",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "reservation_date": future_date,
                "guest_count": 2
            }
        )

        reservation_id = create_response.json()["id"]

        response = test_client.post(
            f"/api/v1/reservations/{reservation_id}/cancel",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "cancelled"

    def test_cancel_nonexistent_reservation(self, test_client, registered_test_user):
        """Test cancelling nonexistent reservation"""
        response = test_client.post(
            "/api/v1/reservations/9999/cancel",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"}
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
