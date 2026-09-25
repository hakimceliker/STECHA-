from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import Conversation, Message, User
from app.schemas.schemas import ConversationOut, MessageIn, MessageOut
from app.services.ai_gateway import chat_completion

router = APIRouter(prefix="/conversations", tags=["chat"])


@router.get("", response_model=list[ConversationOut])
def list_conversations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.created_at.desc())
        .all()
    )


@router.post("", response_model=ConversationOut, status_code=201)
def create_conversation(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    conv = Conversation(user_id=user.id)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("/{conversation_id}/messages", response_model=list[MessageOut])
def list_messages(conversation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    conv = db.get(Conversation, conversation_id)
    if not conv or conv.user_id != user.id:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadı")
    return conv.messages


@router.post("/{conversation_id}/messages", response_model=MessageOut, status_code=201)
def send_message(
    conversation_id: str,
    payload: MessageIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Not: gerçek üründe bu uç nokta Server-Sent Events ile akışlı (streaming)
    yanıt döner (kapsam dokümanı §API uç noktaları). Bu iskelette tek seferlik
    JSON yanıtı ile aynı mantık gösterilir; SSE eklemek küçük bir değişikliktir."""

    conv = db.get(Conversation, conversation_id)
    if not conv or conv.user_id != user.id:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadı")

    user_msg = Message(conversation_id=conv.id, role="user", content=payload.content)
    db.add(user_msg)

    ai = chat_completion(payload.content)
    assistant_msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=ai.content,
        model=ai.model,
        tokens_in=ai.tokens_in,
        tokens_out=ai.tokens_out,
        cost_usd=ai.cost_usd,
    )
    db.add(assistant_msg)

    if conv.title == "Yeni sohbet":
        conv.title = payload.content[:40]

    db.commit()
    db.refresh(assistant_msg)
    return assistant_msg
