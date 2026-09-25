def _auth_headers(client, email="u@u.com"):
    reg = client.post("/api/v1/auth/register", json={"email": email, "password": "sifre1234"})
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_chat_flow(client):
    headers = _auth_headers(client)

    conv = client.post("/api/v1/conversations", headers=headers)
    assert conv.status_code == 201
    conv_id = conv.json()["id"]

    msg = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"content": "Merhaba Stech AI"},
        headers=headers,
    )
    assert msg.status_code == 201
    assert msg.json()["role"] == "assistant"

    history = client.get(f"/api/v1/conversations/{conv_id}/messages", headers=headers)
    assert history.status_code == 200
    assert len(history.json()) == 2  # user + assistant


def test_places_and_booking(client, db_session_factory=None):
    headers = _auth_headers(client, email="yolcu@u.com")

    # Doğrudan modelle bir işletme ekleyelim (admin onay akışını atlıyoruz).
    from app.db.session import SessionLocal
    from app.models.models import Business

    db = SessionLocal()
    biz = Business(type="restaurant", name="Meridyen Köfteci", address="Bolu", status="approved")
    db.add(biz)
    db.commit()
    db.refresh(biz)
    biz_id = biz.id
    db.close()

    search = client.get("/api/v1/places/search", params={"q": "köfteci"})
    assert search.status_code == 200
    assert any(p["id"] == biz_id for p in search.json())

    booking = client.post(
        "/api/v1/bookings",
        json={"business_id": biz_id, "amount_try": 395},
        headers=headers,
    )
    assert booking.status_code == 201
    assert booking.json()["status"] == "confirmed"
