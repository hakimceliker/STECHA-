from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import Booking, Business, User
from app.schemas.schemas import BookingIn, BookingOut, PlaceOut

router = APIRouter(tags=["places"])


@router.get("/places/search", response_model=list[PlaceOut])
def search_places(
    q: str = Query("", description="Serbest metin: örn. 'köfteci'"),
    type: str | None = Query(None, description="restaurant | hotel"),
    limit: int = Query(3, le=20, description="Yol Asistanı varsayılan olarak en iyi 3'ü döner"),
    db: Session = Depends(get_db),
):
    query = db.query(Business).filter(Business.status == "approved")
    if type:
        query = query.filter(Business.type == type)
    if q:
        query = query.filter(Business.name.ilike(f"%{q}%"))
    results = query.limit(limit).all()
    return [
        PlaceOut(
            id=b.id, type=b.type, name=b.name, address=b.address,
            lat=b.lat, lng=b.lng, status=b.status,
        )
        for b in results
    ]


@router.get("/places/{place_id}", response_model=PlaceOut)
def get_place(place_id: str, db: Session = Depends(get_db)):
    b = db.get(Business, place_id)
    if not b:
        raise HTTPException(status_code=404, detail="İşletme bulunamadı")
    return PlaceOut(id=b.id, type=b.type, name=b.name, address=b.address, lat=b.lat, lng=b.lng, status=b.status)


@router.post("/bookings", response_model=BookingOut, status_code=201)
def create_booking(payload: BookingIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    business = db.get(Business, payload.business_id)
    if not business or business.status != "approved":
        raise HTTPException(status_code=404, detail="İşletme bulunamadı veya onaylı değil")

    booking = Booking(
        user_id=user.id,
        business_id=business.id,
        amount_try=payload.amount_try,
        status="confirmed",  # ödeme entegrasyonu bağlanınca "pending" -> webhook ile "confirmed"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/bookings", response_model=list[BookingOut])
def list_bookings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Booking).filter(Booking.user_id == user.id).order_by(Booking.created_at.desc()).all()


@router.post("/bookings/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    booking = db.get(Booking, booking_id)
    if not booking or booking.user_id != user.id:
        raise HTTPException(status_code=404, detail="Rezervasyon bulunamadı")
    booking.status = "cancelled"
    db.commit()
    db.refresh(booking)
    return booking
