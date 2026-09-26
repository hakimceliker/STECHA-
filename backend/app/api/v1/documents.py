"""Document management and processing endpoints"""

import os
import mimetypes
import tempfile
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.db.base import User, Document
from app.services.document_processor import DocumentProcessor, DocumentSearcher

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "uploads/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class DocumentUploadResponse(BaseModel):
    id: int
    filename: str
    size: int
    document_type: str
    text_length: int
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentListItem(BaseModel):
    id: int
    filename: str
    size: int
    document_type: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentDetailResponse(BaseModel):
    id: int
    filename: str
    size: int
    document_type: str
    mime_type: str
    extracted_text: Optional[str]
    doc_metadata: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentSearchRequest(BaseModel):
    query: str
    context_lines: int = 3


class DocumentSearchResponse(BaseModel):
    query: str
    results: list[dict]
    total_results: int


class DocumentUpdateRequest(BaseModel):
    document_type: Optional[str] = None
    doc_metadata: Optional[dict] = None


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = "other",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and process a document with tenant isolation"""

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required"
        )

    # Validate file
    file_content = await file.read()
    file_size = len(file_content)
    await file.seek(0)

    is_valid, message = DocumentProcessor.validate_file(file.filename, file_size)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    # Get MIME type
    mime_type, _ = mimetypes.guess_type(file.filename)
    mime_type = mime_type or "application/octet-stream"

    # Determine document type from extension if not provided
    if document_type == "other":
        ext = os.path.splitext(file.filename)[1].lower()
        if ext == ".pdf":
            document_type = "invoice"
        elif ext in [".docx", ".doc"]:
            document_type = "contract"
        elif ext == ".xlsx":
            document_type = "receipt"

    # Save temporarily and extract text
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(file_content)
        tmp_path = tmp.name

    try:
        extracted_text = DocumentProcessor.extract_text(tmp_path)
    except Exception as e:
        os.unlink(tmp_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing document: {str(e)}"
        )

    # Save to persistent storage
    file_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{datetime.utcnow().timestamp()}_{file.filename}")
    try:
        with open(file_path, 'wb') as f:
            f.write(file_content)
    except Exception as e:
        os.unlink(tmp_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving document: {str(e)}"
        )
    finally:
        os.unlink(tmp_path)

    # Store in database with tenant isolation (user_id)
    db_document = Document(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=mime_type,
        document_type=document_type,
        extracted_text=extracted_text,
        doc_metadata={"uploaded_by": current_user.email}
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)

    return {
        "id": db_document.id,
        "filename": db_document.filename,
        "size": db_document.file_size,
        "document_type": db_document.document_type,
        "text_length": len(extracted_text) if extracted_text else 0,
        "created_at": db_document.created_at
    }


@router.get("/", response_model=list[DocumentListItem])
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    document_type: Optional[str] = None
):
    """List documents for current user with tenant isolation"""

    query = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.is_deleted == False
    )

    if document_type:
        query = query.filter(Document.document_type == document_type)

    documents = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    return documents


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get document details with access control"""

    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
        Document.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied"
        )

    return document


@router.post("/{document_id}/search", response_model=DocumentSearchResponse)
async def search_document(
    document_id: int,
    request: DocumentSearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search within a document"""

    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
        Document.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied"
        )

    if not document.extracted_text:
        return {
            "query": request.query,
            "results": [],
            "total_results": 0
        }

    results = DocumentSearcher.search(
        document.extracted_text,
        request.query,
        request.context_lines
    )

    return {
        "query": request.query,
        "results": results,
        "total_results": len(results)
    }


@router.put("/{document_id}", response_model=DocumentDetailResponse)
async def update_document(
    document_id: int,
    request: DocumentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update document metadata"""

    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
        Document.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied"
        )

    if request.document_type:
        document.document_type = request.document_type

    if request.doc_metadata:
        if document.doc_metadata:
            document.doc_metadata.update(request.doc_metadata)
        else:
            document.doc_metadata = request.doc_metadata

    document.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(document)

    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soft delete a document"""

    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
        Document.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied"
        )

    document.is_deleted = True
    document.updated_at = datetime.utcnow()
    db.commit()

    return None
