"""Pre-Orders endpoint tests for STECH AI"""

import pytest
from fastapi import status
from datetime import datetime, timedelta


@pytest.mark.pre_orders
class TestPreOrdersCreate:
    """Test pre-order creation"""

    def test_create_pre_order_success(self, test_client, registered_test_user, test_business):
        """Test successful pre-order creation"""
        pickup_date = (datetime.utcnow() + timedelta(days=3)).isoformat()

        response = test_client.post(
            "/api/v1/pre-orders",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "items": [
                    {"name": "Burger", "quantity": 2, "price": 50},
                    {"name": "Fries", "quantity": 1, "price": 25}
                ],
                "items_description": "2x Burger, 1x Fries",
                "pickup_date": pickup_date,
                "total_try": 125.0
            }
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["business_id"] == test_business.id
        assert data["total_try"] == 125.0
        assert data["currency"] == "TRY"
        assert data["payment_status"] == "pending"
        assert data["status"] == "pending"

    def test_create_pre_order_no_items(self, test_client, registered_test_user, test_business):
        """Test that pre-order without items is rejected"""
        response = test_client.post(
            "/api/v1/pre-orders",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "items": [],
                "total_try": 0.0
            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "at least one item" in response.json()["detail"].lower()

    def test_create_pre_order_zero_price(self, test_client, registered_test_user, test_business):
        """Test that zero price is rejected"""
        response = test_client.post(
            "/api/v1/pre-orders",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "items": [{"name": "Item", "quantity": 1, "price": 0}],
                "total_try": 0.0
            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "greater than 0" in response.json()["detail"].lower()

    def test_create_pre_order_past_pickup_date(self, test_client, registered_test_user, test_business):
        """Test that past pickup date is rejected"""
        past_date = (datetime.utcnow() - timedelta(days=1)).isoformat()

        response = test_client.post(
            "/api/v1/pre-orders",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "items": [{"name": "Burger", "quantity": 1, "price": 50}],
                "pickup_date": past_date,
                "total_try": 50.0
            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "past" in response.json()["detail"].lower()

    def test_create_pre_order_nonexistent_business(self, test_client, registered_test_user):
        """Test that nonexistent business is rejected"""
        response = test_client.post(
            "/api/v1/pre-orders",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": 9999,
                "items": [{"name": "Burger", "quantity": 1, "price": 50}],
                "total_try": 50.0
            }
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_pre_order_requires_auth(self, test_client, test_business):
        """Test that pre-order creation requires authentication"""
        response = test_client.post(
            "/api/v1/pre-orders",
            json={
                "business_id": test_business.id,
                "items": [{"name": "Burger", "quantity": 1, "price": 50}],
                "total_try": 50.0
            }
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.pre_orders
class TestPreOrdersRead:
    """Test pre-order reading"""

    def test_list_pre_orders(self, test_client, registered_test_user, test_business):
        """Test listing pre-orders"""
        # Create a pre-order first
        test_client.post(
            "/api/v1/pre-orders",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "items": [{"name": "Burger", "quantity": 1, "price": 50}],
                "total_try": 50.0
            }
        )

        response = test_client.get(
            "/api/v1/pre-orders",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1

    def test_get_specific_pre_order(self, test_client, registered_test_user, test_business):
        """Test getting a specific pre-order"""
        # Create a pre-order
        create_response = test_client.post(
            "/api/v1/pre-orders",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "items": [
                    {"name": "Burger", "quantity": 2, "price": 50},
                    {"name": "Fries", "quantity": 1, "price": 25}
                ],
                "items_description": "2x Burger, 1x Fries",
                "total_try": 125.0
            }
        )

        pre_order_id = create_response.json()["id"]

        response = test_client.get(
            f"/api/v1/pre-orders/{pre_order_id}",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == pre_order_id
        assert data["total_try"] == 125.0

    def test_get_nonexistent_pre_order(self, test_client, registered_test_user):
        """Test getting nonexistent pre-order"""
        response = test_client.get(
            "/api/v1/pre-orders/9999",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"}
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.pre_orders
class TestPreOrdersUpdate:
    """Test pre-order updates"""

    def test_update_pre_order_items(self, test_client, registered_test_user, test_business):
        """Test updating items"""
        # Create a pre-order
        create_response = test_client.post(
            "/api/v1/pre-orders",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "items": [{"name": "Burger", "quantity": 1, "price": 50}],
                "total_try": 50.0
            }
        )

        pre_order_id = create_response.json()["id"]

        response = test_client.patch(
            f"/api/v1/pre-orders/{pre_order_id}",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "items": [
                    {"name": "Burger", "quantity": 2, "price": 50},
                    {"name": "Fries", "quantity": 1, "price": 25}
                ],
                "total_try": 125.0
            }
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total_try"] == 125.0

    def test_update_pre_order_pickup_date(self, test_client, registered_test_user, test_business):
        """Test updating pickup date"""
        pickup_date = (datetime.utcnow() + timedelta(days=3)).isoformat()
        new_pickup_date = (datetime.utcnow() + timedelta(days=5)).isoformat()

        # Create a pre-order
        create_response = test_client.post(
            "/api/v1/pre-orders",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "items": [{"name": "Burger", "quantity": 1, "price": 50}],
                "pickup_date": pickup_date,
                "total_try": 50.0
            }
        )

        pre_order_id = create_response.json()["id"]

        response = test_client.patch(
            f"/api/v1/pre-orders/{pre_order_id}",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={"pickup_date": new_pickup_date}
        )

        assert response.status_code == status.HTTP_200_OK

    def test_update_pre_order_to_empty_items(self, test_client, registered_test_user, test_business):
        """Test that updating to empty items is rejected"""
        # Create a pre-order
        create_response = test_client.post(
            "/api/v1/pre-orders",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "items": [{"name": "Burger", "quantity": 1, "price": 50}],
                "total_try": 50.0
            }
        )

        pre_order_id = create_response.json()["id"]

        response = test_client.patch(
            f"/api/v1/pre-orders/{pre_order_id}",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={"items": []}
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.pre_orders
class TestPreOrdersCancellation:
    """Test pre-order cancellation"""

    def test_cancel_pre_order(self, test_client, registered_test_user, test_business):
        """Test cancelling a pre-order"""
        # Create a pre-order
        create_response = test_client.post(
            "/api/v1/pre-orders",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"},
            json={
                "business_id": test_business.id,
                "items": [{"name": "Burger", "quantity": 1, "price": 50}],
                "total_try": 50.0
            }
        )

        pre_order_id = create_response.json()["id"]

        response = test_client.post(
            f"/api/v1/pre-orders/{pre_order_id}/cancel",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "cancelled"

    def test_cancel_nonexistent_pre_order(self, test_client, registered_test_user):
        """Test cancelling nonexistent pre-order"""
        response = test_client.post(
            "/api/v1/pre-orders/9999/cancel",
            headers={"Authorization": f"Bearer {registered_test_user['token']}"}
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
