"""Pre_orders endpoints"""
from fastapi import APIRouter

router = APIRouter(tags=["pre_orders"])

@router.get("/pre_orders")
def list_pre_orders():
    return {"items": []}

@router.post("/pre_orders")
def create_pre_orders():
    return {"id": 1, "status": "created"}
