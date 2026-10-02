"""Chat endpoints with Anthropic AI integration"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.db.base import User, Conversation, Message
from app.core.config import settings
from app.services.anthropic_service import AnthropicService, AnthropicStreamService

router = APIRouter(tags=["chat"])

class ChatRequest(BaseModel):
    conversation_id: int = None
    message: str
    stream: bool = False

class ChatResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    tokens_used: int
    cost_usd: float
    created_at: datetime

class ConversationResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    message_count: int

# Initialize Anthropic services
def get_anthropic_service() -> AnthropicService:
    """Get Anthropic service instance"""
    if settings.AI_PROVIDER != "anthropic":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Anthropic AI provider not configured"
        )
    return AnthropicService(api_key=settings.AI_PROVIDER_API_KEY)

def get_anthropic_stream_service() -> AnthropicStreamService:
    """Get Anthropic stream service instance"""
    if settings.AI_PROVIDER != "anthropic":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Anthropic AI provider not configured"
        )
    return AnthropicStreamService(api_key=settings.AI_PROVIDER_API_KEY)

@router.get("/conversations")
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """List user's conversations"""

    conversations = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.created_at.desc()).limit(limit).all()

    return [
        {
            "id": c.id,
            "title": c.title,
            "created_at": c.created_at,
            "pinned": c.pinned,
            "message_count": db.query(Message).filter(
                Message.conversation_id == c.id
            ).count()
        }
        for c in conversations
    ]

@router.post("/conversations")
async def create_conversation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    title: str = "New Conversation"
):
    """Create a new conversation"""

    conversation = Conversation(
        user_id=current_user.id,
        title=title,
        created_at=datetime.utcnow()
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        message_count=0
    )

@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get conversation with all messages"""

    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at).all()

    return {
        "conversation": {
            "id": conversation.id,
            "title": conversation.title,
            "created_at": conversation.created_at
        },
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at,
                "tokens_in": m.tokens_in,
                "tokens_out": m.tokens_out,
                "cost_usd": m.cost_usd
            }
            for m in messages
        ]
    }

@router.post("/chat")
async def send_message(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    anthropic_service: AnthropicService = Depends(get_anthropic_service)
):
    """Send a message in a conversation"""

    # Get or create conversation
    if request.conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == request.conversation_id,
            Conversation.user_id == current_user.id
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(
            user_id=current_user.id,
            title=request.message[:50],
            created_at=datetime.utcnow()
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Save user message
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
        created_at=datetime.utcnow()
    )
    db.add(user_message)
    db.commit()

    # Get AI response
    try:
        result = anthropic_service.chat(
            message=request.message,
            conversation_id=str(conversation.id)
        )

        # Calculate tokens and cost (approximate)
        input_tokens = result["usage"]["input_tokens"]
        output_tokens = result["usage"]["output_tokens"]

        # Claude 3.5 Sonnet pricing: $3/1M input tokens, $15/1M output tokens
        cost = (input_tokens * 3 + output_tokens * 15) / 1_000_000

        # Save assistant message
        assistant_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=result["response"],
            model=result["model"],
            tokens_in=input_tokens,
            tokens_out=output_tokens,
            cost_usd=cost,
            created_at=datetime.utcnow()
        )
        db.add(assistant_message)
        db.commit()
        db.refresh(assistant_message)

        return ChatResponse(
            id=assistant_message.id,
            conversation_id=conversation.id,
            role="assistant",
            content=result["response"],
            tokens_used=input_tokens + output_tokens,
            cost_usd=cost,
            created_at=assistant_message.created_at
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating response: {str(e)}"
        )

@router.post("/chat/stream")
async def stream_message(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    anthropic_stream_service: AnthropicStreamService = Depends(get_anthropic_stream_service)
):
    """Stream a chat message response"""

    # Get or create conversation
    if request.conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == request.conversation_id,
            Conversation.user_id == current_user.id
        ).first()
    else:
        conversation = Conversation(
            user_id=current_user.id,
            title=request.message[:50],
            created_at=datetime.utcnow()
        )
        db.add(conversation)
        db.commit()

    # Save user message
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
        created_at=datetime.utcnow()
    )
    db.add(user_message)
    db.commit()

    async def generate():
        try:
            for chunk in anthropic_stream_service.stream_chat(request.message):
                yield chunk
        except Exception as e:
            yield f"\nError: {str(e)}"

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a conversation"""

    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Delete messages first
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    db.delete(conversation)
    db.commit()

    return {"status": "deleted"}
