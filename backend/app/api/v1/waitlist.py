"""Waitlist endpoints"""
from fastapi import APIRouter

router = APIRouter(tags=["waitlist"])

@router.get("/waitlist")
def list_waitlist():
    return {"items": []}

@router.post("/waitlist")
def create_waitlist():
    return {"id": 1, "status": "created"}
