"""Authentication endpoints"""
from fastapi import APIRouter

router = APIRouter(tags=["auth"])

@router.post("/auth/register")
def register(email: str, password: str, name: str):
    return {"status": "ok"}

@router.post("/auth/login")
def login(username: str, password: str):
    return {"access_token": "mock-token", "token_type": "bearer"}

@router.get("/auth/me")
def get_current_user():
    return {"id": 1, "email": "user@example.com", "name": "User"}
