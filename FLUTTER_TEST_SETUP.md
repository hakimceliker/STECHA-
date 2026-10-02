# Flutter Test Setup & Verification

**Versiyon:** 0.1.0  
**Platform:** Windows + Linux (Docker)  
**Hedef:** `flutter pub get` + `flutter test` başarılı

---

## 📱 Stage 7 Mobile Implementation Status

### ✅ Kodlanmış
- Map ekranı (Google Maps ile yer arama)
- Reservation ekranı (CRUD)
- PreOrder ekranı (form + toplamlandırma)
- Payment stub ekranı (placeholder)
- SOS/Emergency ekranı
- `ChangeNotifier` state management
- API client (reservation, pre-order, approval endpoints)
- Widget testler (tab rendering, navigation)

### 📦 Yeni Dependencies

```yaml
# pubspec.yaml
dependencies:
  google_maps_flutter: ^2.10.0
  geolocator: ^9.0.0
  provider: ^6.0.0
  form_validator: ^2.1.0
  json_serializable: ^6.8.0
  uuid: ^4.0.0
```

---

## 🔧 Flutter SDK Setup (Windows)

### Problem: Git Ownership Check Failed

```
Flutter SDK repository ownership check failed
```

### Çözüm

#### Option 1: Git Safe Directory (Önerilen)

```powershell
# Global safety rule ekle
git config --global --add safe.directory '*'

# Kontrol et
git config --global --get-all safe.directory
# Output: *

# Flutter doctor çalıştır
cd C:\path\to\flutter
flutter doctor -v
# Çıkmazsa: Flutter SDK init edilir
```

#### Option 2: Yeni Flutter Install

```powershell
# Mevcut Flutter'ı kontrol et
flutter --version
flutter doctor -v

# Sorun varsa: Yeniden kur
# https://flutter.dev/docs/get-started/install/windows
# 1. Download Flutter SDK (latest stable)
# 2. Unzip to C:\src\flutter
# 3. Add to PATH: C:\src\flutter\bin
# 4. Run: flutter doctor

# Setup
flutter config --no-analytics
flutter precache
```

#### Option 3: Linux Container (Docker)

```dockerfile
# Dockerfile.flutter
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    curl git unzip \
    openjdk-17-jdk-headless \
    && rm -rf /var/lib/apt/lists/*

# Flutter SDK
ENV FLUTTER_HOME=/opt/flutter
RUN git clone https://github.com/flutter/flutter.git $FLUTTER_HOME
ENV PATH="$FLUTTER_HOME/bin:$PATH"

# Setup
RUN flutter config --no-analytics
RUN flutter precache

WORKDIR /app/mobile
```

```bash
# Build & Run
docker build -f Dockerfile.flutter -t flutter-test .
docker run -v $(pwd):/app flutter-test \
  bash -c "flutter pub get && flutter test"
```

---

## ✅ Test Procedure (Windows)

### Adım 1: Environment Hazırlığı

```powershell
# Git safety (sorun varsa)
git config --global --add safe.directory '*'

# Flutter kontrol
flutter --version
# Output: Flutter 3.16.x / Dart 3.2.x

flutter doctor -v
# Kontrol: Tüm [✓] olmalı
# Exceptions:
# - VS Code extensions: Optional
# - Chrome: Optional (widget test için)
```

### Adım 2: Pub Dependencies

```powershell
cd mobile
flutter pub get
# Çıktı: "Running: pub get" → "Resolving dependencies..." → "Got dependencies!"

# Kontrol
flutter pub list  # Installed packages
cat pubspec.lock  # Lock file oluşmuş
```

### Adım 3: Code Analysis

```powershell
flutter analyze
# Çıktı: "No issues found" veya
# - Warning: Unused import "..."
# - Info: ...

# Strict mode (opsiyonel)
dart analyze --fatal-warnings
```

### Adım 4: Widget Tests

```powershell
flutter test --verbose
# veya
flutter test test/

# Beklenen çıktı:
# ✓ Home page builds and displays
# ✓ Tab navigation works
# ✓ Map screen renders
# ✓ Reservation form submits
# ...
# "X tests passed"
```

### Adım 5: Coverage (opsiyonel)

```powershell
flutter test --coverage

# Report oluştur (Dart)
pub global activate coverage
format_coverage --lcov --in=coverage/lcov.info --out=coverage/lcov-formatted.info

# HTML report (opsiyonel)
genhtml coverage/lcov-formatted.info -o coverage/html
start coverage/html/index.html
```

---

## 📊 Test Output Örneği

```
Running: flutter pub get...
Running: flutter test test/ --no-pub...

Launching lib/main.dart on Chrome in debug mode...
Waiting for connection from debug service on...

✓ test/widgets/home_page_test.dart: Home page builds and displays (2.5s)
✓ test/widgets/home_page_test.dart: Tab navigation works (1.2s)
✓ test/widgets/map_screen_test.dart: Map screen renders (1.8s)
✓ test/widgets/reservation_screen_test.dart: Reservation form submits (2.1s)
✓ test/widgets/preorder_screen_test.dart: PreOrder calculation correct (1.5s)

════════════════════════════════════════════════════════════════════════════════
All tests passed! (5 tests ran in 9.1s)
════════════════════════════════════════════════════════════════════════════════
```

---

## 🔍 Common Issues & Fixes

### Issue 1: "git not found" on Windows

```powershell
# Git yüklü mü?
git --version

# Yüklü değilse:
# https://git-scm.com/download/win → Install

# Flutter PATH'te mi?
flutter --version
```

### Issue 2: "pub get" hangs

```powershell
# Timeout'a alın
flutter pub get --verbose
Ctrl+C

# Try again
flutter pub get
# veya
flutter pub get --no-offline
```

### Issue 3: "Chrome not found" (widget test)

```powershell
# Chrome/Chromium yüklü mü?
# Windows: Edge işine yarar
flutter test --web-renderer=skwasm  # WebAssembly renderer

# veya
# Skip web tests
flutter test test/ --exclude-tags=integration
```

### Issue 4: Permission denied on Android

```powershell
# Android SDK path doğru mu?
flutter doctor -v | grep -A5 "Android"

# Java JDK yüklü mü?
java -version

# ANDROID_SDK_ROOT set edilmiş mi?
echo $env:ANDROID_SDK_ROOT  # Windows
# veya
echo $ANDROID_SDK_ROOT  # Linux/Mac
```

---

## 🎯 Binding Constraint: Flutter Tests Pass

**PASS Şartı:**
1. ✅ `flutter pub get` → dependencies resolved
2. ✅ `flutter analyze` → No issues found
3. ✅ `flutter test` → Tüm testler geçti
4. ✅ Coverage: Min 70% (opsiyonel)

**Sonuç Dosyası: `FLUTTER_TEST_RESULT.txt`**

```
Flutter Test Result
==================
Date: 2026-09-26
Status: PASSED

SDK Version: Flutter 3.16.5 / Dart 3.2.3
Platform: Windows 11
Java: OpenJDK 17.0.1

Commands Executed:
1. flutter pub get → SUCCESS
2. flutter analyze → SUCCESS (No issues)
3. flutter test → SUCCESS (5/5 tests passed)
4. flutter test --coverage → SUCCESS (72% coverage)

Test Results:
- Home page builds and displays: PASS
- Tab navigation works: PASS
- Map screen renders: PASS
- Reservation form submits: PASS
- PreOrder calculation correct: PASS

Exit Code: 0
==================
```

---

## 📱 Next Steps: Staging Deployment

Flutter tests ✅ başarılı ise:
1. → STAGING_DEPLOYMENT.md başlayın
2. PostgreSQL staging ortamında UI testleri
3. API integration tests

---

## 🔗 Resources

- Flutter Docs: https://flutter.dev/docs
- Widget Testing: https://flutter.dev/docs/testing/unit-testing
- GitHub Actions: https://github.com/flutter/flutter/wiki/GitHub-Actions
- Package Pub: https://pub.dev
