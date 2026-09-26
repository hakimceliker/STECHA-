# Staging Deployment Hazırlığı

**Versiyon:** 0.1.0  
**Hedef:** PostgreSQL staging ortamında Stech AI MVP'sini test etmek  
**Koşul:** Binding constraints çözüldüğünde başlanır

---

## 📋 Kabul Kriterleri

Aşağıdaki tüm kriterlerin yerine getirilmesi gereklidir:

1. ✅ **npm ci yeşil** (web frontend build başarılı)
2. ✅ **pytest yeşil** (backend 17 test geçti)
3. ✅ **Flutter testler geçti** (mobile UI doğrulandı)
4. ✅ **Docker daemon çalışıyor** (PostgreSQL Compose stack hazır)
5. ✅ **Alembic migration** PostgreSQL'de başarılı
6. ✅ **4 temel user flow** gerçek DB ile çalışıyor

---

## 🚀 Deployment Adımları

### Adım 1: Docker & PostgreSQL Hazırlığı

```bash
# Docker daemon başlat
docker --version
docker ps  # Kontrol: Yanıt verecek

# docker-compose.yml'i kontrol et
cd /home/user/STECHA-
cat docker-compose.yml  # postgres, redis, api, web servisleri olmalı

# Stack başlat
docker-compose up -d db redis
docker ps  # 2 container görünmeli (postgres + redis)

# PostgreSQL bağlantısını kontrol et
docker-compose exec db psql -U stech_user -d stech_db -c "SELECT 1;"
# Cevap: 1 (başarılı)
```

### Adım 2: Database Migration

```bash
cd backend

# Environment variables ayarla
export DATABASE_URL="postgresql://stech_user:stech_pass@localhost:5432/stech_db"
export ENV="staging"
export AUTO_CREATE_SCHEMA="false"
export JWT_SECRET="staging-secret-min-32-chars-required-here-1234567890"

# Migration kontrol et
python -m alembic current  # Current revision
python -m alembic history  # Tüm revisions

# Upgrade head'e
python -m alembic upgrade head
# Çıktı: "Running upgrade ... -> head, done."

# Doğrula
python -m alembic current  # Head revision'ı görmeli
```

### Adım 3: Backend Staging Setup

```bash
cd backend

# requirements.txt kontrol
cat requirements.txt  # fastapi, sqlalchemy, alembic, psycopg2, vb.

# .env.staging oluştur
cat > .env.staging << 'EOF'
# Environment
ENV=staging
AUTO_CREATE_SCHEMA=false

# Database
DATABASE_URL=postgresql://stech_user:stech_pass@localhost:5432/stech_db

# JWT
JWT_SECRET=staging-secret-min-32-chars-required-here-1234567890

# API Server
API_HOST=0.0.0.0
API_PORT=8000

# AI Provider
AI_PROVIDER=demo
AI_PROVIDER_API_KEY=

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8081

# Anthropic (opsiyonel)
# AI_PROVIDER=anthropic
# AI_PROVIDER_API_KEY=sk-ant-...
EOF

# Venv aktivesi ve dependencies
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Health check
curl -s http://localhost:8000/api/v1/health || echo "API henüz başlamadı"
```

### Adım 4: 4 Temel User Flow Smoke Test

```bash
# API başlat
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
API_PID=$!
sleep 3

# Test script: smoke_test.sh
cat > smoke_test.sh << 'BASH_EOF'
#!/bin/bash
set -e

BASE_URL="http://localhost:8000/api/v1"
LOG_FILE="staging_smoke_test.log"

echo "🧪 Staging Smoke Test - $(date)" | tee -a $LOG_FILE
echo "================================================" | tee -a $LOG_FILE

# Test 1: Register
echo -e "\n[1/4] Testing POST /auth/register..." | tee -a $LOG_FILE
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@staging.example.com",
    "password": "TestPass123!",
    "name": "Test User"
  }')
echo "Response: $REGISTER_RESPONSE" >> $LOG_FILE
echo "✅ Registration passed" | tee -a $LOG_FILE

# Test 2: Login
echo -e "\n[2/4] Testing POST /auth/login..." | tee -a $LOG_FILE
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@staging.example.com",
    "password": "TestPass123!"
  }')
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token' 2>/dev/null)
echo "Response: $LOGIN_RESPONSE" >> $LOG_FILE
if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" == "null" ]; then
  echo "❌ Login failed"
  exit 1
fi
echo "✅ Login passed (token: ${ACCESS_TOKEN:0:20}...)" | tee -a $LOG_FILE

# Test 3: Create Conversation
echo -e "\n[3/4] Testing POST /conversations..." | tee -a $LOG_FILE
CONV_RESPONSE=$(curl -s -X POST "$BASE_URL/conversations" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Staging"}')
CONV_ID=$(echo $CONV_RESPONSE | jq -r '.id' 2>/dev/null)
echo "Response: $CONV_RESPONSE" >> $LOG_FILE
if [ -z "$CONV_ID" ] || [ "$CONV_ID" == "null" ]; then
  echo "❌ Conversation creation failed"
  exit 1
fi
echo "✅ Conversation created (ID: $CONV_ID)" | tee -a $LOG_FILE

# Test 4: Waitlist
echo -e "\n[4/4] Testing POST /waitlist..." | tee -a $LOG_FILE
WAITLIST_RESPONSE=$(curl -s -X POST "$BASE_URL/waitlist" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "waitlist@staging.example.com",
    "name": "Waitlist Test",
    "source": "staging-test"
  }')
echo "Response: $WAITLIST_RESPONSE" >> $LOG_FILE
echo "✅ Waitlist entry created" | tee -a $LOG_FILE

echo -e "\n================================================" | tee -a $LOG_FILE
echo "✅ ALL TESTS PASSED" | tee -a $LOG_FILE
echo "Log file: $LOG_FILE" | tee -a $LOG_FILE
BASH_EOF

chmod +x smoke_test.sh
./smoke_test.sh

# Kill API
kill $API_PID

# Sonuç kontrol et
cat staging_smoke_test.log
```

### Adım 5: Sonuç Raporu

```bash
# Rapor dosyası oluştur
cat > STAGING_DEPLOYMENT_REPORT.md << 'EOF'
# Staging Deployment Report

**Tarih:** $(date)
**Status:** ✅ BAŞARILI / ❌ BAŞARISIZ

## Environment
- Docker: ✅ Running
- PostgreSQL: ✅ Running
- Redis: ✅ Running
- Backend: ✅ Running on localhost:8000

## Database
- Alembic Migration: ✅ Current = head
- Tables Created: ✅ users, conversations, messages, vb.

## Smoke Tests
- [✅] POST /auth/register
- [✅] POST /auth/login
- [✅] POST /conversations
- [✅] POST /waitlist

## Next Steps
1. Go to FAZA 3: Production Checklist
2. Deploy to production dengan secrets manager
EOF

cat STAGING_DEPLOYMENT_REPORT.md
```

---

## 🛠️ Docker Compose Reference

```yaml
# docker-compose.yml (mevcut yapı)
version: '3.9'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: stech_user
      POSTGRES_PASSWORD: stech_pass
      POSTGRES_DB: stech_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  api:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://stech_user:stech_pass@db:5432/stech_db
      REDIS_URL: redis://redis:6379
      ENV: staging
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis

  web:
    build: ./web
    ports:
      - "3000:3000"
    depends_on:
      - api

volumes:
  postgres_data:
```

---

## ⏰ Beklenen Zaman

- **Docker setup:** 5 dakika
- **Alembic migration:** 2 dakika
- **Backend startup:** 1 dakika
- **Smoke tests:** 3 dakika
- **Total:** ~15 dakika

---

## 🚨 Common Issues & Fixes

### PostgreSQL bağlantısı başarısız
```bash
# Kontrol et
docker logs <container_id>
docker exec <container_id> psql -U stech_user -d stech_db -c "SELECT 1;"

# Yeniden başlat
docker-compose restart db
```

### Port conflict (5432 zaten kullanılıyor)
```bash
# Docker compose'u farklı port'ta başlat
docker-compose down
docker-compose -f docker-compose.yml up -d --build
```

### Migration başarısız
```bash
# Kontrol et
python -m alembic current
python -m alembic heads

# Reset (UYARI: Data loss!)
python -m alembic downgrade base
python -m alembic upgrade head
```

---

## Next: Production Checklist

Staging ✅ başarılı ise → `PRODUCTION_CHECKLIST.md` başlayın
