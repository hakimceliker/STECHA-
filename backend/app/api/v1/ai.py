"""AI Gateway and Chat endpoints"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.db.base import User, ConversationMessage
from app.services.ai_gateway import AIGateway, AIProvider, AIModel
from app.services.vector_store import get_vector_store

router = APIRouter(prefix="/ai", tags=["ai"])


class MessageRequest(BaseModel):
    conversation_id: int
    content: str
    provider: str = "openai"  # openai, anthropic, cohere
    model: str = "gpt-3.5-turbo"


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    model: Optional[str]
    provider: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    conversation_id: int
    messages: list[MessageResponse]
    reply: MessageResponse


class ConversationHistoryRequest(BaseModel):
    limit: int = 50


class ConversationHistoryResponse(BaseModel):
    conversation_id: int
    messages: list[MessageResponse]
    total: int


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: MessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message and get AI response"""

    # Validate provider and model
    try:
        provider = AIProvider(request.provider)
        model = AIModel(request.model)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid provider or model: {str(e)}"
        )

    # Store user message
    user_message = ConversationMessage(
        conversation_id=request.conversation_id,
        user_id=current_user.id,
        role="user",
        content=request.content,
        model=request.model,
        provider=request.provider,
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    # Get conversation history for context
    history = db.query(ConversationMessage).filter(
        ConversationMessage.conversation_id == request.conversation_id,
        ConversationMessage.user_id == current_user.id
    ).order_by(ConversationMessage.created_at).all()

    # Build message list for AI
    messages = [
        {"role": msg.role, "content": msg.content}
        for msg in history
    ]

    # Call AI gateway
    try:
        ai_gateway = AIGateway(provider=provider, model=model)
        system_prompt = f"You are a helpful AI assistant for {current_user.email}. Provide clear and concise responses."
        reply_content = ai_gateway.chat(
            messages=messages,
            system_prompt=system_prompt,
            temperature=0.7,
            max_tokens=1000
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calling AI provider: {str(e)}"
        )

    # Store assistant response
    assistant_message = ConversationMessage(
        conversation_id=request.conversation_id,
        user_id=current_user.id,
        role="assistant",
        content=reply_content,
        model=request.model,
        provider=request.provider,
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    return {
        "conversation_id": request.conversation_id,
        "messages": [
            {
                "id": msg.id,
                "conversation_id": msg.conversation_id,
                "role": msg.role,
                "content": msg.content,
                "model": msg.model,
                "provider": msg.provider,
                "created_at": msg.created_at,
            }
            for msg in history
        ],
        "reply": {
            "id": assistant_message.id,
            "conversation_id": assistant_message.conversation_id,
            "role": assistant_message.role,
            "content": assistant_message.content,
            "model": assistant_message.model,
            "provider": assistant_message.provider,
            "created_at": assistant_message.created_at,
        }
    }


@router.get("/conversations/{conversation_id}/history", response_model=ConversationHistoryResponse)
async def get_conversation_history(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """Get conversation history"""

    messages = db.query(ConversationMessage).filter(
        ConversationMessage.conversation_id == conversation_id,
        ConversationMessage.user_id == current_user.id
    ).order_by(ConversationMessage.created_at.desc()).limit(limit).all()

    # Reverse to get chronological order
    messages.reverse()

    return {
        "conversation_id": conversation_id,
        "messages": [
            {
                "id": msg.id,
                "conversation_id": msg.conversation_id,
                "role": msg.role,
                "content": msg.content,
                "model": msg.model,
                "provider": msg.provider,
                "created_at": msg.created_at,
            }
            for msg in messages
        ],
        "total": len(messages)
    }


@router.post("/embeddings")
async def generate_embeddings(
    text: str,
    provider: str = "openai",
    current_user: User = Depends(get_current_user)
):
    """Generate embeddings for text (for RAG)"""

    try:
        provider_enum = AIProvider(provider)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid provider: {provider}"
        )

    try:
        ai_gateway = AIGateway(provider=provider_enum)
        embeddings = ai_gateway.embeddings(text)
        return {
            "text": text,
            "embeddings": embeddings,
            "dimension": len(embeddings),
            "provider": provider
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating embeddings: {str(e)}"
        )


@router.get("/vector-store/stats")
async def get_vector_store_stats(
    current_user: User = Depends(get_current_user)
):
    """Get vector store statistics"""

    vector_store = get_vector_store()
    stats = vector_store.get_stats()

    return {
        "total_vectors": stats["total_vectors"],
        "vector_dimension": stats["vector_dimension"],
        "status": "operational"
    }
