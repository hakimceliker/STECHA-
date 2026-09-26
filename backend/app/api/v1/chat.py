"""Chat endpoints"""
from fastapi import APIRouter

router = APIRouter(tags=["chat"])

@router.get("/chat")
def list_chat():
    return {"items": []}

@router.post("/chat")
def create_chat():
    return {"id": 1, "status": "created"}
