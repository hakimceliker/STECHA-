"""Reservations endpoints"""
from fastapi import APIRouter

router = APIRouter(tags=["reservations"])

@router.get("/reservations")
def list_reservations():
    return {"items": []}

@router.post("/reservations")
def create_reservations():
    return {"id": 1, "status": "created"}
