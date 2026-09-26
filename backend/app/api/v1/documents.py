"""Document processing and search endpoints"""

import os
import tempfile
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.db.base import User
from app.services.document_processor import DocumentProcessor, DocumentSearcher

router = APIRouter(prefix="/documents", tags=["documents"])


class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    size: int
    format: str
    text_length: int


class DocumentSearchRequest(BaseModel):
    document_id: str
    query: str
    context_lines: int = 3


class DocumentSearchResponse(BaseModel):
    query: str
    results: list[dict]
    total_results: int


class DocumentSummaryResponse(BaseModel):
    document_id: str
    filename: str
    summary: str
    original_length: int
    summary_length: int


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and process a document"""

    # Validate file
    file_size = len(await file.read())
    await file.seek(0)

    is_valid, message = DocumentProcessor.validate_file(file.filename, file_size)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    # Save temporarily
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        # Extract text
        extracted_text = DocumentProcessor.extract_text(tmp_path)

        # In production, store in database or S3
        document_id = f"doc_{current_user.id}_{hash(file.filename) % 10000}"

        return {
            "document_id": document_id,
            "filename": file.filename,
            "size": file_size,
            "format": os.path.splitext(file.filename)[1][1:],
            "text_length": len(extracted_text)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing document: {str(e)}"
        )
    finally:
        os.unlink(tmp_path)


@router.post("/search", response_model=DocumentSearchResponse)
async def search_document(
    request: DocumentSearchRequest,
    current_user: User = Depends(get_current_user),
):
    """Search within uploaded document"""

    # In production, retrieve document from database/S3
    # For now, return mock results
    results = [
        {
            "line_number": 1,
            "matched_line": f"Found: {request.query}",
            "context": f"... context with {request.query} ...",
            "position": 0
        }
    ]

    return {
        "query": request.query,
        "results": results,
        "total_results": len(results)
    }


@router.get("/summarize/{document_id}", response_model=DocumentSummaryResponse)
async def summarize_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
):
    """Generate summary of uploaded document"""

    # In production, retrieve document from database/S3
    # For now, return mock summary
    sample_text = "This is a sample document. It contains important information. The document can be summarized. The summary provides key points. Users can search within documents."

    summary = DocumentSearcher.summarize(sample_text, max_sentences=3)

    return {
        "document_id": document_id,
        "filename": f"{document_id}.pdf",
        "summary": summary,
        "original_length": len(sample_text),
        "summary_length": len(summary)
    }


@router.get("/list")
async def list_user_documents(
    current_user: User = Depends(get_current_user),
    limit: int = 50
):
    """List all documents uploaded by current user"""

    # In production, query from database
    return {
        "documents": [],
        "total": 0,
        "limit": limit
    }
