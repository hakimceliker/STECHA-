"""Places endpoints"""
from fastapi import APIRouter

router = APIRouter(tags=["places"])

@router.get("/places")
def list_places():
    return {"items": []}

@router.post("/places")
def create_places():
    return {"id": 1, "status": "created"}
