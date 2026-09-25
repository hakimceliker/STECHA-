from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import Transaction, User, Wallet
from app.schemas.schemas import TransactionOut, WalletOut

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("", response_model=WalletOut)
def get_wallet(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    wallet = db.get(Wallet, user.id)
    if not wallet:
        raise HTTPException(status_code=404, detail="Cüzdan bulunamadı")
    return WalletOut(balance_try=wallet.balance_try)


@router.get("/transactions", response_model=list[TransactionOut])
def list_transactions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == user.id)
        .order_by(Transaction.created_at.desc())
        .all()
    )
