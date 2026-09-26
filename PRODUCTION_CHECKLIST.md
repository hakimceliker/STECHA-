# Production Security & Deployment Checklist

**Versiyon:** 0.1.0  
**Başlangıç:** Staging ✅ başarılı olduktan sonra  
**Son Güncelleme:** 26 Eylül 2026

---

## 🔴 KRITIK (P0) - Deployment bloğu (Deploy öncesi TÜM ✅)

### Secrets & Credentials Management

- [ ] **JWT_SECRET**
  - [ ] Min 32 karakter, random (cryptographically secure)
  - [ ] Örnek: `secrets.token_urlsafe(32)`
  - [ ] Kontrol: `echo $JWT_SECRET | wc -c` → 33+ karakter
  - [ ] ⚠️ Asla hardcoded kodda değil, secret manager'da
  - [ ] Tool: AWS Secrets Manager / HashiCorp Vault / Doppler

- [ ] **DATABASE_URL**
  - [ ] PostgreSQL TLS/SSL enforced
  - [ ] Format: `postgresql://user:pass@host:5432/db?sslmode=require`
  - [ ] Kontrol: `psql "$(echo $DATABASE_URL)" -c "SELECT ssl_enabled();"` → true
  - [ ] User password: min 16 karakter, complex
  - [ ] Okuma izni: Least privilege (SELECT, INSERT, UPDATE, DELETE sadece)

- [ ] **Anthropic API Key**
  - [ ] Secret manager'da saklanıyor
  - [ ] Asla .env dosyasında hardcoded değil
  - [ ] Key rotation: her 90 gün
  - [ ] Monitoring: Unauthorized access attempts
  - [ ] Kontrol: `echo $AI_PROVIDER_API_KEY | grep -E '^sk-ant-' | wc -c` → 30+

- [ ] **Payment Provider Keys (Stripe vb.)**
  - [ ] Secret key (SK) production environment'ta saklanıyor
  - [ ] Publishable key (PK) web client'a verilecek
  - [ ] Webhook secret: güvenli kanalda iletişim
  - [ ] Key rotation: Her breach'ten sonra

### Environment & Config

- [ ] **ENV Variable**
  - [ ] `ENV=production` (hardcoded değil, deployment config'ten)
  - [ ] `ENV != development` doğrulaması startup'ta
  - [ ] Kontrol: `curl https://api.example.com/api/v1/health | jq '.env'` → "production"

- [ ] **AUTO_CREATE_SCHEMA**
  - [ ] `AUTO_CREATE_SCHEMA=false` production'ta
  - [ ] Migrations Alembic üzerinden (migration drift yok)
  - [ ] Startup'ta kontrol: `if AUTO_CREATE_SCHEMA: raise ConfigError(...)`

- [ ] **CORS Origins**
  - [ ] Whitelist: yalnızca gerçek domain'ler
  - [ ] Örnek: `CORS_ORIGINS=https://www.stechapp.com,https://app.stechapp.com`
  - [ ] Wildcard `*` asla production'ta
  - [ ] Kontrol: `curl -H "Origin: https://evil.com" ... | grep "Access-Control-Allow-Origin"`

- [ ] **Debug Mode Deaktif**
  - [ ] `DEBUG=false` production'ta
  - [ ] Exception stack trace'ler user'a görünmemeli
  - [ ] Error response: `{"error": "Internal server error"}` (detail yok)
  - [ ] Kontrol: `curl https://api.example.com/invalid | jq '.detail'` → null

### API Security

- [ ] **Rate Limiting & Throttling**
  - [ ] Login endpoint: 5 attempts / 15 minutes
  - [ ] API endpoints: 100 requests / minute (authenticated user)
  - [ ] Public endpoints: 30 requests / minute (unauthenticated)
  - [ ] Tool: FastAPI Slowapi / Redis-based rate limiter
  - [ ] Kontrol: `for i in {1..101}; do curl https://api.example.com/api/v1/users; done | tail -1 | grep 429`

- [ ] **Input Validation**
  - [ ] Tüm POST/PATCH body'ler Pydantic schemas ile doğrulanıyor
  - [ ] String fields: max length enforced
  - [ ] Email: EmailStr validation
  - [ ] Kontrol: `curl -X POST https://api.example.com/auth/register -d '{"email":"bad","password":"x"}'` → 422

- [ ] **SQL Injection Protection**
  - [ ] SQLAlchemy ORM kullanılıyor (raw SQL yok)
  - [ ] Parameter binding: `query.filter(Model.id == id)` (f-string asla!)
  - [ ] Kontrol: `SELECT COUNT(*) FROM information_schema.tables WHERE table_name='users';` → doğrulama

- [ ] **XSS Prevention**
  - [ ] Web response'lar HTML-escaped
  - [ ] Content-Security-Policy header'ı set edilmiş
  - [ ] JSON response'lar güvenli
  - [ ] Kontrol: `curl -I https://www.stechapp.com | grep Content-Security-Policy`

### Authentication & Authorization

- [ ] **JWT Token Security**
  - [ ] Algorithm: HS256 (secure secret) veya RS256 (public/private key)
  - [ ] Expiration: 1 hour (access token)
  - [ ] Refresh token: 7 days (secure HttpOnly cookie)
  - [ ] Kontrol: `jwt decode $TOKEN` → exp claim'i kontrol et

- [ ] **Password Policy**
  - [ ] Min 8 karakter (enforced)
  - [ ] Complexity: uppercase, lowercase, number, symbol (optional)
  - [ ] Hashing: bcrypt with salt (passlib kullanılıyor)
  - [ ] Kontrol: `SELECT password_hash FROM users WHERE email='test@example.com';` → $2b$...

- [ ] **Session Management**
  - [ ] Token logout / token revocation (blacklist/Redis)
  - [ ] Same-origin requests (CSRF token web'te)
  - [ ] HttpOnly, Secure, SameSite cookie flags
  - [ ] Kontrol: `curl -I https://api.example.com/auth/me | grep Set-Cookie`

---

## 🟠 ÖNEMLİ (P1) - Go-live öncesi kontrol

### Payment & Financial

- [ ] **Webhook Signature Verification**
  - [ ] Stripe: `stripe.Webhook.construct_event()` kullanılıyor
  - [ ] Signature verification: HMAC-SHA256 ile
  - [ ] Timing attack protection: constant-time comparison
  - [ ] Kontrol: Test webhook'ları production'ta verify edildi

- [ ] **Idempotent Transactions**
  - [ ] PreOrder creation: `idempotency_key` unique constraint var mı?
  - [ ] Duplicate request: aynı response döner (database de repeat insert yok)
  - [ ] Kontrol: 2x POST /pre-orders same idempotency_key → same response, 1 record

- [ ] **Payment Status Tracking**
  - [ ] Status: pending → approved → paid / failed
  - [ ] Refund flow: paid → refunded
  - [ ] Reconciliation: provider billing ile daily
  - [ ] Kontrol: Stripe dashboard vs database status match

### Observability & Monitoring

- [ ] **Error Logging & Sentry**
  - [ ] Sentry integration: critical errors sent
  - [ ] Alert: 500 errors, timeout patterns
  - [ ] Retention: 90 days
  - [ ] Kontrol: Sentry project dashboard açılıyor, test event gönderiliyor

- [ ] **Access Audit Log**
  - [ ] User login: timestamp, IP, user_agent logged
  - [ ] API calls: method, endpoint, status_code, duration
  - [ ] Data modification: create/update/delete with user_id
  - [ ] Retention: 12 months
  - [ ] Kontrol: `SELECT * FROM audit_log WHERE user_id=123 ORDER BY created_at DESC LIMIT 1;`

- [ ] **Performance Monitoring**
  - [ ] Response time: 95th percentile < 500ms
  - [ ] Database query time: slow query log (> 1s)
  - [ ] CPU & Memory: < 80% utilization
  - [ ] Tool: Prometheus + Grafana / New Relic

### Data Protection

- [ ] **Database Backups**
  - [ ] Daily automated backup (PostgreSQL pg_dump)
  - [ ] Backup location: Separate storage (AWS S3, Google Cloud Storage)
  - [ ] Retention: 30 days
  - [ ] Encryption: AES-256 at rest
  - [ ] Kontrol: Restore test haftada 1 kere (production copy'de)

- [ ] **Data Encryption**
  - [ ] PII fields (password, card data): encrypted or hashed
  - [ ] Transit: TLS 1.2+ (HTTPS, psycopg2 ssl_mode=require)
  - [ ] At-rest: Database encryption enabled
  - [ ] Kontrol: `SELECT * FROM information_schema.sslinfo;` → SSL enabled

- [ ] **GDPR Compliance (eğer EU users var)**
  - [ ] Privacy Policy link: web'te erişilir
  - [ ] Data retention: User deletion cascade
  - [ ] Export functionality: user data JSON export (GET /auth/me + conversations)
  - [ ] Kontrol: Delete user → conversations, messages cascade deleted

### Infrastructure

- [ ] **WAF (Web Application Firewall)**
  - [ ] Cloudflare / AWS WAF rules active
  - [ ] SQL injection patterns: blocked
  - [ ] XSS patterns: blocked
  - [ ] DDoS protection: enabled
  - [ ] Kontrol: Malicious request → 403 Forbidden

- [ ] **HTTPS/TLS**
  - [ ] Certificate: valid, not self-signed
  - [ ] HSTS header: `Strict-Transport-Security: max-age=31536000`
  - [ ] Certificate renewal: automated (Let's Encrypt bot)
  - [ ] Kontrol: `openssl s_client -connect api.example.com:443 | grep -A5 "Verify return code"`

- [ ] **Database Connection Pooling**
  - [ ] Connection pool size: configured (default: 20)
  - [ ] Idle timeout: 30 minutes
  - [ ] Max overflow: reasonable (default: 10)
  - [ ] Kontrol: `SELECT count(*) FROM pg_stat_activity;` → < pool size

---

## 🟡 İYİLEŞTİRME (P2) - Sonraki Sprint'ler

- [ ] Admin operasyon paneli (CRUD users, reservations, vb.)
- [ ] Analytics dashboard (Daily active users, revenue)
- [ ] Document extraction (CV parsing, receipt OCR)
- [ ] Multi-provider AI routing (Claude, GPT-4 fallback)
- [ ] Disaster recovery runbook (RTO: 4 hours, RPO: 1 hour)
- [ ] Advanced fraud detection (Reservation/PreOrder anomalies)
- [ ] Email template system (Resend / SES integration)
- [ ] Push notifications (mobile alerts for reservations)

---

## 📋 Deployment Workflow

### Pre-deployment

```bash
# 1. Tüm checklist items ✅ doğrulandı
# 2. Staging test ✅ başarılı
# 3. Code review ✅ approved
# 4. Database backup ✅ taken

# 5. Security scan
python -m pip install bandit
bandit -r backend/app -ll  # Low-level issues

# 6. Dependency audit
pip audit  # Known vulnerabilities

# 7. Load test (opsiyonel)
# ab -n 1000 -c 100 https://api.staging.example.com/api/v1/health
```

### Deployment (Zero-downtime blue-green)

```bash
# 1. Scale to 2 instances (if using load balancer)
# 2. Deploy new code to green instance
# 3. Health check: /api/v1/health → 200 OK
# 4. Switch traffic: LoadBalancer → green
# 5. Monitor: errors, latency for 5 minutes
# 6. Scale down blue instance
```

### Post-deployment

```bash
# 1. Smoke tests: register → login → chat
# 2. Sentry: no new critical errors
# 3. Database: no slow queries
# 4. Audit log: deployment event recorded
# 5. Stakeholder: deployment notification sent
```

---

## ✅ Sign-off Checklist

**Deployment yetkilisi (DevOps / Tech Lead) tarafından onaylanmalı:**

- [ ] P0 items: TÜM ✅ (14/14)
- [ ] P1 items: Min 10/12 ✅
- [ ] Staging test: ✅ Passed
- [ ] Code review: ✅ Approved
- [ ] Security scan: ✅ No critical issues
- [ ] On-call rotation: ✅ Active

**Tarih:** _______________  
**İsim:** _______________  
**Signature:** _______________

---

## 🚨 Incident Response

Deployment sonrası sorun olursa:

1. **Immediate:** Rollback to previous version
2. **Notify:** Team + stakeholders
3. **Investigate:** Logs (Sentry, audit log, application logs)
4. **Fix:** Root cause çöz
5. **Re-deploy:** Düzeltme ile yeniden deploy et
6. **Post-mortem:** Next week review

---

## 📞 Production Support

**On-call:** DevOps / Backend Lead  
**Escalation:** CTO / Product Manager  
**Runbook:** https://wiki.example.com/stech-ai-runbook  
**Status Page:** https://status.stechapp.com
