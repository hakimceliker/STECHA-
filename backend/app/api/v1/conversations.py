"""Conversations endpoints"""
from fastapi import APIRouter

router = APIRouter(tags=["conversations"])

@router.get("/conversations")
def list_conversations():
    return {"items": []}

@router.post("/conversations")
def create_conversations():
    return {"id": 1, "status": "created"}
