def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_register_and_login(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "elif@example.com", "password": "sifre1234", "name": "Elif",
    })
    assert r.status_code == 201
    tokens = r.json()
    assert "access_token" in tokens

    r2 = client.post("/api/v1/auth/login", json={
        "email": "elif@example.com", "password": "sifre1234",
    })
    assert r2.status_code == 200

    r3 = client.post("/api/v1/auth/login", json={
        "email": "elif@example.com", "password": "yanlis",
    })
    assert r3.status_code == 401


def test_me_requires_auth(client):
    r = client.get("/api/v1/auth/me")
    assert r.status_code == 401

    reg = client.post("/api/v1/auth/register", json={
        "email": "a@a.com", "password": "sifre1234",
    })
    token = reg.json()["access_token"]
    r2 = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 200
    assert r2.json()["email"] == "a@a.com"
