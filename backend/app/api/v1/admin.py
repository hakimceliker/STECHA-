from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.models import Booking, Business, Conversation, Document, User
from app.schemas.schemas import AdminSummary

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/metrics", response_model=AdminSummary)
def metrics(db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    return AdminSummary(
        total_users=db.query(User).count(),
        total_conversations=db.query(Conversation).count(),
        total_documents=db.query(Document).count(),
        total_businesses=db.query(Business).count(),
        total_bookings=db.query(Booking).count(),
    )
