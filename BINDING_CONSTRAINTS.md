# Binding Constraints - Çözüm Planı

**Son Güncelleme:** 26 Eylül 2026

---

## 🔴 Kritik Blokaj: npm ci + pytest yeşil olmadan Aşama 7'ye geçilmez

Kural: `npm run ci ✅ AND pytest ✅` → Aşama 7 başlayabilir

---

## Problem 1: Backend pytest Başarısız (PyPI 403)

### Hata Mesajı
```
ERROR: Tunnel connection failed: 403 Forbidden
ERROR: Could not find a version that satisfies the requirement fastapi==0.115.0
```

### Sebep
Kurumsal network proxy, PyPI registry'sine erişimi blokluyor.

### Çözüm Seçenekleri

#### **Option A: IT/Network Bypass (Önerilen)**
```bash
# IT admin'den talep:
# 1. PyPI (https://pypi.org) erişim izni
# 2. npm registry (https://registry.npmjs.org) erişim izni

# Kontrol:
curl -I https://pypi.org/simple/
curl -I https://registry.npmjs.org/
```

#### **Option B: Lokal Windows Makine (İmmediyer)**
```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m pytest app/tests -q --tb=short
```

**Sonuç rapor edilecek:**
- ✅/❌ Passed/Failed count
- 📊 stdout/stderr tam çıktısı
- 🕐 Execution time

#### **Option C: Local VPN / Proxy Config**
```bash
# npm config
npm config set registry https://registry.npmjs.org/

# pip config (~/.pip/pip.conf)
[global]
index-url = https://pypi.org/simple/
timeout = 120
```

---

## Problem 2: Frontend npm ci EPERM (Dosya Silme Engelleme)

### Hata Mesajı
```
npm error code EPERM
npm error syscall unlink
npm error [Error: EPERM: operation not permitted, unlink ... .package-lock.json]
```

### Sebep
Device bridge (WSL/VM) file deletion restrictions - connected folder'da dosya silme izni yok.

### Çözüm Seçenekleri

#### **Option A: npm install kullan (Çalıştığı Bilinmiyor)**
```bash
cd web
npm install --prefer-offline --no-audit
npm run build
```

#### **Option B: node_modules silip npm ci çalıştır**
```bash
cd web
rm -rf node_modules
npm ci
npm run build
```

#### **Option C: Yerel Windows Machine**
```powershell
cd web
npm ci
npm run build
```

**Sonuç rapor edilecek:**
- ✅ npm ci başarılı
- ✅ npm run build başarılı
- 📊 Exit code: 0

---

## Problem 3: Flutter SDK Git Ownership (pub get başarısız)

### Hata Mesajı
```
Flutter SDK repository ownership check failed
```

### Sebep
Flutter SDK, Git ownership/tool lookup'u başarısız oluyor. Yeni dependency eklenmesi engelleniyor.

### Çözüm

#### **Option A: Flutter SDK Ownership Kontrol (Windows)**
```bash
flutter doctor -v
git config --global --add safe.directory '*'
cd mobile
flutter pub get
flutter analyze
flutter test
```

#### **Option B: Yeni Flutter Install**
```powershell
# Yeni Flutter SDK kur
# https://flutter.dev/docs/get-started/install

flutter doctor -v
cd mobile
flutter pub get
flutter test
```

**Sonuç rapor edilecek:**
- ✅ flutter pub get başarılı
- ✅ flutter analyze: "No issues found"
- ✅ flutter test: widget test count ve passed count

---

## Kontrol Listesi: Yeşil Olana Kadar

### Backend
- [ ] `pip install -r requirements.txt` → Başarılı
- [ ] `pytest app/tests -q` → 17 passed
- [ ] Sonuç dosya: `BACKEND_TEST_RESULT.txt`

### Frontend
- [ ] `npm ci` → Başarılı
- [ ] `npm run build` → exit code 0
- [ ] Sonuç dosya: `FRONTEND_CI_RESULT.txt`

### Mobile
- [ ] `flutter pub get` → Başarılı
- [ ] `flutter analyze` → No issues
- [ ] `flutter test` → Tüm testler pass
- [ ] Sonuç dosya: `FLUTTER_TEST_RESULT.txt`

---

## Sonraki Adım

Tüm 3 blokaj çözüldüğünde:
✅ **FAZA 2: Staging Deployment** başlayabilir

---

## İletişim

- Dokümantasyon: `/home/user/STECHA-/BINDING_CONSTRAINTS.md`
- Sonuç Raporları: `*_RESULT.txt` dosyaları
- Versiyon: 0.1.0 MVP
