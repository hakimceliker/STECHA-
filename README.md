# Stech AI - Türkçe AI Asistan Platformu

**Versiyon:** 0.1.0 MVP  
**Status:** Development  
**Tarih:** 26 Eylül 2026

---

## 📱 Proje Tanımı

Stech AI, Türkçe konuşan kullanıcılar için:
- 💬 **Sohbet & AI Asistan** - Claude AI ile Türkçe konuşma
- 🍽️ **Masa Rezervasyonu** - Restorand rezervasyonu
- 📦 **Ön Sipariş** - Önceden sipariş verme
- 📍 **Yer Arama** - Yakın işletmeler
- ⏳ **Bekleme Listesi** - Erken erişim

---

## 🏗️ Proje Yapısı

```
stech-ai/
├── backend/              # FastAPI backend
│   ├── app/
│   ├── requirements.txt
│   └── Dockerfile
├── web/                  # Next.js frontend
│   ├── src/app/
│   ├── package.json
│   └── Dockerfile
├── mobile/               # Flutter mobile
│   ├── lib/
│   └── pubspec.yaml
├── docker-compose.yml
└── .env.example
```

---

## 🚀 Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Web
```bash
cd web
npm install
npm run dev
```

### Mobile
```bash
cd mobile
flutter pub get
flutter run
```

### Docker (Recommended)
```bash
docker-compose up -d
```

---

## 📚 Documentation

- **ROADMAP.md** - Project phases and timeline
- **BINDING_CONSTRAINTS.md** - Current blockers and solutions
- **STAGING_DEPLOYMENT.md** - Staging deployment guide
- **PRODUCTION_CHECKLIST.md** - Production security checklist

---

## 🔄 Current Status

- ✅ Stage 2-4: Source, build, backend tests
- ✅ Stage 7: Mobile UI code
- 🔄 Binding constraints: Resolving
- ⏳ Staging: PostgreSQL deployment
- 📋 Production: Security checklist

---

## 🛠️ Tech Stack

- **Backend:** FastAPI, SQLAlchemy, PostgreSQL
- **Frontend:** Next.js, React, TypeScript
- **Mobile:** Flutter, Dart
- **Auth:** JWT + bcrypt
- **AI:** Anthropic API
- **Container:** Docker & Docker Compose

---

**Last Updated:** 26 Eylül 2026
