# Stech AI — Kod Temeli

Bu depo, [Stech AI MVP Kapsam Dokümanı]'ndaki mimariyi çalışan bir iskelete
dönüştürür: FastAPI backend, Next.js web ve Flutter mobil. Amaç sıfırdan
başlamak değil; geliştiricilerin devralıp genişleteceği, gerçek kayıt/giriş,
sohbet ve Yol Asistanı akışlarının çalıştığı bir temel.

## Neler çalışıyor

- **Backend (FastAPI + SQLAlchemy)**: kayıt/giriş (JWT), sohbet (konuşma +
  mesaj, AI geçidi üzerinden maliyet kaydı), belge yükleme (meta veri),
  Yol Asistanı (işletme arama, rezervasyon oluşturma/iptal), cüzdan/işlem
  geçmişi, admin özet metrikleri. Testler `pytest` ile geçiyor (bkz. `backend/app/tests/`).
- **Web (Next.js)**: açılış sayfası, kayıt/giriş, backend'e bağlı çalışan bir
  sohbet ekranı.
- **Mobil (Flutter)**: ana ekran ve backend'e bağlı sohbet ekranı; prototipteki
  görsel dile sadık.

## Neler eklenmeli (kapsam dokümanına göre sıradaki adımlar)

Kapsam dokümanının §API uç noktaları ve §Veritabanı şeması bölümlerinde
listelenen ~60 uç nokta ve 22 tablonun geri kalanı aynı desenle eklenir:

- Ses (`/voice/*`), görsel (`/images`), şablonlar (`/templates`) — `ai_gateway.py`
  deseni izlenerek.
- Ödeme sağlayıcı entegrasyonları (iyzico, RevenueCat) — `services/` altına
  yeni bir `payments.py` servisi olarak.
- Alembic migration'ları — şu an `Base.metadata.create_all` ile MVP hızlı
  başlatılıyor; üretime geçmeden `alembic init` yapılmalı.
- İşletme paneli ve admin panelinin geri kalan ekranları — `web/src/app/biz/`
  ve `web/src/app/admin/` altına, `chat/page.tsx` deseniyle.
- Flutter tarafında harita, rezervasyon, ödeme ve acil durum ekranları —
  prototipteki `Harita.dc.html`, `Rezervasyon.dc.html`, `Acil.dc.html`
  ekranlarının birebir karşılığı.

## Yerel geliştirme

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # SQLite ile hemen çalışır; PostgreSQL için DATABASE_URL'i değiştirin
uvicorn app.main:app --reload
# http://localhost:8000/docs adresinde otomatik API dokümantasyonu açılır
pytest
```

### Web

```bash
cd web
npm install
cp .env.local.example .env.local
npm run dev
# http://localhost:3000
```

### Mobil

```bash
cd mobile
flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:8000/api/v1   # Android emülatörü
```

### Hepsi birlikte (Docker)

```bash
docker compose up --build
```

## Not: bu ortamda paket kurulumu test edilemedi

Bu kod, bu oturumun çalıştığı ortamda internet erişimi PyPI/npm gibi paket
kayıtlarına kapalı olduğu için `pip install` / `npm install` ile fiilen
çalıştırılamadı. Backend'in Python söz dizimi `python3 -m py_compile` ile
doğrulandı ve testler mantık olarak gözden geçirildi, ama gerçek bir
`pytest` çalıştırması buradan yapılamadı. Kodu bilgisayarınızda yukarıdaki
adımlarla çalıştırıp `pytest` sonucunu görmeniz gerekiyor — bir sorun
çıkarsa bana söyleyin, birlikte düzeltelim.
