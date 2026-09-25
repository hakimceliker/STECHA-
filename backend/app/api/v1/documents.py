import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import Document, User
from app.schemas.schemas import DocumentOut

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_TYPES = {"pdf", "docx", "xlsx", "txt"}


@router.get("", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Document).filter(Document.user_id == user.id).order_by(Document.created_at.desc()).all()


@router.post("", response_model=DocumentOut, status_code=201)
async def upload_document(
    file: UploadFile,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Not: bu iskelet dosyayı diske değil, sadece meta veriyi kaydeder.
    Üretimde S3 uyumlu depolamaya yüklenir ve `file_key` o adres olur
    (kapsam dokümanı §Teknik mimari)."""

    ext = (file.filename or "").rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "txt"
    if ext not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Desteklenmeyen dosya türü: {ext}")

    doc = Document(
        user_id=user.id,
        file_key=f"uploads/{uuid.uuid4()}-{file.filename}",
        type=ext,
        status="ready",  # gerçek işleme kuyruğu eklenince "processing" olur
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc
