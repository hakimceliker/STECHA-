"""Wallet endpoints"""
from fastapi import APIRouter

router = APIRouter(tags=["wallet"])

@router.get("/wallet")
def list_wallet():
    return {"items": []}

@router.post("/wallet")
def create_wallet():
    return {"id": 1, "status": "created"}
