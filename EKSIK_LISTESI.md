# Stech AI — Eksik Maddeler Listesi (Missing Items List)

**Tarih:** 2026-09-25  
**Durum:** Stage 1 Prototip Tamamlandı, Stage 2'ye Geçiş Engelli

---

## 1. Test Yürütme (Test Execution)

### Backend Testleri (pytest)
- **Durum:** ❌ Çalıştırılamıyor (Cannot Execute)
- **Neden:** PyPI HTTP 403 Proxy Blocking
- **Bağımlılıklar:** 
  - ❌ pytest 8.3.3 (installed)
  - ❌ fastapi 0.115.0 (not installed)
  - ❌ sqlalchemy 2.0.35 (not installed)
  - ❌ httpx 0.27.2 (not installed)
- **Test Dosyaları:** ✅ Mevcut
  - app/tests/test_auth.py
  - app/tests/test_chat_and_places.py
  - app/tests/conftest.py
- **Sonraki Adım:** PyPI proxy whitelist istemeye gerek (IT)

### Frontend Testleri (npm ci)
- **Durum:** ❌ Çalıştırılamıyor (Cannot Execute)
- **Neden:** EPERM file deletion + npm registry proxy blocking
- **Engeller:**
  - ❌ device bridge mnt/ filesystem read-only (node_modules deletion denied)
  - ❌ npm registry https://registry.npmjs.org/ proxy blocked
- **Paket Dosyaları:** ✅ Mevcut
  - package.json
  - package-lock.json (16KB)
  - node_modules (existing, EPERM-locked)
- **Sonraki Adımlar:**
  1. Device bridge delete permission iste VEYA
  2. npm registry proxy whitelist iste (IT)

---

## 2. GitHub Actions CI/CD Pipeline

### Durum: ❌ Tamamen Eksik
- **Neden:** No .github/workflows/ directory exists

### Gerekli İş Akışları (Required Workflows)
1. **test-backend.yml** - pytest CI workflow
   - Trigger: Push to main/feature branches
   - Steps: Install requirements → pytest app/tests/ -v
   - Status: ❌ NOT CREATED

2. **test-frontend.yml** - npm ci CI workflow
   - Trigger: Push to main/feature branches
   - Steps: npm ci → npm run build
   - Status: ❌ NOT CREATED

3. **binding-constraint.yml** - Binding constraint validation
   - Trigger: PR / before merge to main
   - Requirements: BOTH backend tests PASS AND frontend build PASS
   - Status: ❌ NOT CREATED

### Sonraki Adım: Create .github/workflows/ directory and workflow files

---

## 3. Kitap Bağlantısı Tamamlanması (Book Connection Completion)

### Durum: ❌ Tanımlanmamış
- **Neden:** Frontend kitap sayfası mock, arka uç entegrasyon eksik

### Gerekli Bileşenler (Required Components)
1. **Backend Routes/APIs**
   - ❌ GET /api/v1/books - Kitap listesi
   - ❌ GET /api/v1/books/{id} - Kitap detayı
   - ❌ POST /api/v1/books - Kitap oluştur
   - ❌ PUT /api/v1/books/{id} - Kitap güncelle
   - ❌ DELETE /api/v1/books/{id} - Kitap sil
   - Status: Not created in app/api/v1/

2. **Database Models**
   - ❌ Book model (SQLAlchemy)
   - ❌ Book schema (Pydantic)
   - Status: Not in app/models/models.py

3. **Frontend Screens**
   - ❌ Books list view
   - ❌ Book detail view
   - ❌ Book create/edit form
   - Status: Mock placeholder only

4. **Error Handling**
   - ❌ 404 for book not found
   - ❌ Validation error responses
   - ❌ Authorization checks
   - Status: Not implemented

5. **Tests**
   - ❌ test_books_api.py (backend)
   - ❌ books.test.ts (frontend)
   - Status: Not created

### Sonraki Adım: Implement complete book connection feature after Stage 2

---

## 4. Binding Constraint Doğrulaması (Validation)

### Durum: ❌ Başarısız (FAILED)

| Test | Gerekli | Durum | Neden |
|------|---------|-------|-------|
| pytest app/tests/ | ✅ Evet | ❌ Çalıştırılamıyor | PyPI 403 |
| npm run ci | ✅ Evet | ❌ Çalıştırılamıyor | EPERM + npm 403 |
| **GATE** | **✅ Her ikisi** | **❌ FAILED** | **Network** |

### Sonraki Adım: Proxy whitelist istek (IT) → Test yeniden çalıştır

---

## 5. Aşama 2 Hazırlığı (Stage 2 Preparation)

### Durum: ❌ Engelli (Blocked)
- **Neden:** Binding constraint failed - cannot proceed
- **Gerekli:** Stage 1 tests MUST pass before Stage 2 starts

### Stage 2 Belirtimi (Spec)
- Document: Claude Docs "Stech AI — Sıradaki Adımlar İş Akışı"
- Artifact ID: d384e2eb-a150-4f49-8711-bd5064f40c81
- Status: ✅ Hazır, ancak uygulanmamış (Ready but not implemented)

---

## Önceliklendirme (Prioritization)

### KRITIK (CRITICAL) - Blocking Progress
1. ❌ PyPI proxy whitelist (Corporate IT)
2. ❌ npm registry proxy whitelist (Corporate IT)
3. ❌ GitHub Actions CI/CD workflows (Development)

### ÖNEMLİ (IMPORTANT) - After Network Fixed
1. ❌ Pytest execution and validation
2. ❌ npm ci execution and build validation
3. ❌ Binding constraint PASS verification

### DÜŞÜk ÖNCELİK (LOWER PRIORITY) - After Stage 1 Cleared
1. ❌ Book connection feature (Stage 2)
2. ❌ Additional test coverage
3. ❌ Documentation completion

---

## Sonuç (Conclusion)

**Stage 1 Tamamlama:** ✅ Prototip hazır  
**Test Doğrulaması:** ❌ Başarısız (network blocking)  
**Stage 2'ye İlerleme:** ❌ Engelli (binding constraint failed)  

**Bekleme Durumu:** Network proxy exceptions ve device bridge permission çözümü bekleniyor

---

**Güncellenme:** 2026-09-25 18:32 UTC  
**Sonraki Kontrol:** Network proxy whitelist onaylandıktan sonra
