# Stech AI Proje Yol Haritası & İş Akışı

**Versiyon:** 0.1.0 MVP  
**Durum:** Yerel test bloğu (ağ engelleri) — Staging bekleniyor  
**Son Güncelleme:** 26 Eylül 2026

---

## 📊 Aşamalar Durumu Özeti

| Aşama | Başlık | Durum | Kanıt | Blokaj |
|-------|--------|-------|------|--------|
| **2** | Kaynak Denetimi | ✅ PASS | Proje yapısı doğrulandı | Yok |
| **3** | Web/Backend Entegrasyonu | ✅ PASS | Build ve lint başarılı | Yok |
| **4** | Backend & Approval Sistem | ✅ PASS (Lokal) | 17 test geçti, approval endpoints | Docker daemon |
| **7** | Mobil UI (Flutter) | 🔄 Yapılmış / Test Bekliyor | 5 sekme ekran, state yönetimi | SDK Git ownership |

---

## 🔴 Mevcut Bağımlılıklar (Binding Constraints)

### 1. **Test Bloğu: npm ci & pytest yeşil olması gerekli**

**Problem:** Network proxy (kurumsal) PyPI ve npm registry'sini blokluyor
- **Backend**: `pip install -r requirements.txt` → HTTP 403
- **Frontend**: `npm ci` → EPERM (dosya silme izni)

**Çözüm:**
- [ ] IT/Network: PyPI ve npm registry erişim izni
- [ ] Lokal makinede (Windows) testler çalıştırılacak
- [ ] Sonuçlar rapora kaydedilecek

### 2. **Docker Daemon Kapalı**
- PostgreSQL staging smoke test yapılmıyor
- Docker Compose tanımlı ama çalıştırılmıyor

### 3. **Flutter SDK Git Ownership**
- Yeni dependency çözümü (`flutter pub get`) başarısız

---

## 🚀 İş Akışı: MVP → Production

### **FAZA 1: Yerel Doğrulama (Devam Ediyor)**

✅ **Tamamlanan:**
- [x] Proje klasörü ve dosyaları doğrulandı
- [x] Backend requirements.txt ve test yazılmış
- [x] Alembic migration chain (SQLite lokal): upgrade/downgrade başarılı
- [x] 17 pytest geçti
- [x] Web lint ve production build başarılı
- [x] Flutter 5 ekran UI koşullandırılmış

⏳ **Yapılması Gereken:**
- [ ] npm ci komutu başarılı çalıştır (network proxy / EPERM çöz)
- [ ] pytest app/tests -q yeşil doğrula (PyPI erişim gerekli)
- [ ] Flutter pub get ve flutter test tekrar çalıştır (SDK ownership çöz)
- [ ] Docker daemon başlat → PostgreSQL Compose stack aç
- [ ] alembic upgrade head PostgreSQL'de çalıştır (migration smoke)
- [ ] Anthropic live key ile smoke test yap
- [ ] Google Places live API test
- [ ] Payment provider webhook doğrulaması

---

## 📋 FAZA 2: Staging Deployment

**Kabul Şartı:**
1. ✅ Binding constraint çözüldü (npm ci + pytest yeşil)
2. ✅ Flutter testleri yeniden geçti
3. ✅ Docker PostgreSQL staging çalışıyor
4. ✅ Alembic migration PostgreSQL'de başarılı
5. ✅ User flows gerçek DB ile çalışıyor

**Görevler:**
- [ ] PostgreSQL credentials/secrets manager'a taşı
- [ ] CORS origins production'a ayarla
- [ ] JWT_SECRET güçlü yapı
- [ ] ENV=production ve AUTO_CREATE_SCHEMA=false kontrol
- [ ] Staging ortamında /health → 200 OK
- [ ] 4 temel user flow smoke test

---

## 🔒 FAZA 3: Production Checklist

**Kritik (P0):**
- [ ] Güçlü JWT_SECRET ve credentials yönetimi
- [ ] ENV=production enforced
- [ ] PostgreSQL TLS
- [ ] CORS origin'ler konfigürasyonu
- [ ] Rate limiting & brute-force protection
- [ ] Error response'larda hassas bilgi yok

**Önemli (P1):**
- [ ] Ödeme webhook signature doğrulaması
- [ ] Audit log & observability
- [ ] Backup/restore tatbikatı
- [ ] File upload validation
- [ ] XSS koruması

---

## 📊 Mevcut Yetenekler

**✅ Çalışan:**
- Email/password kaydı ve JWT login
- Kullanıcıya bağlı sohbet geçmişi
- Demo AI fallback + Anthropic Messages API
- Masa rezervasyonu (CRUD)
- Ön sipariş idempotent işlem
- Deterministic approval scoring
- Landing page waitlist
- Flutter 5-ekran UI prototype

**❌ Doğrulanmamış:**
- Canlı ödeme (payment provider webhook)
- Google Places canlı API
- Email gönderimi (Resend/SES)
- PostgreSQL staging
- Monitoring (Sentry, rate limiting)
- Admin/business panels
