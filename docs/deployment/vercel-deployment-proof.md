# Vercel Deployment Proof & Testing

**Status**: Phase 1 Implementation  
**Date**: 2026-10-04  
**Team**: Vercel (Deployment & Infrastructure Owner)

---

## Preview Deployment Verification

### Automated Preview Deployment (Feature Branches)

When a feature branch is pushed to GitHub, Vercel automatically:

1. **Detects Push**: GitHub webhook triggers Vercel builder
2. **Clones Repository**: Fetches branch code
3. **Installs Dependencies**: `npm ci` with lockfile
4. **Runs Build**: `npm run build` (Next.js compilation)
5. **Deploys to Preview**: Creates ephemeral environment
6. **Posts Status to PR**: Adds deployment link as check

**Expected Outcome**:
- Preview URL: `https://feature-[branch-name]--stechai.vercel.app`
- Deployment status: ✓ READY (green check)
- Build logs accessible in Vercel dashboard
- PR shows comment with preview link

### Manual Test: Verify Preview Deployment

```bash
# 1. Create test feature branch
git checkout -b feature/vercel-test

# 2. Make minimal change
echo "# Vercel Test" >> README.md

# 3. Push to trigger preview deployment
git push -u origin feature/vercel-test

# 4. Check PR for Vercel status check
# Expected: Link to https://feature-vercel-test--stechai.vercel.app

# 5. Test preview deployment is live
curl -I https://feature-vercel-test--stechai.vercel.app
# Expected: HTTP 200, proper headers

# 6. Clean up test branch
git checkout main
git branch -D feature/vercel-test
git push origin --delete feature/vercel-test
```

---

## Production Deployment Configuration

### Manual Production Deployment (Main Branch)

Production deployments follow this workflow:

1. **Feature branch** development & testing
2. **PR created** to main branch
3. **CI checks pass** (GitHub Actions: lint, build, tests)
4. **Claude security review** approves (no P0/P1 findings)
5. **PR merged to main** → triggers Vercel production build
6. **Production deployment** to stechai.app
7. **Smoke tests** verify production is healthy
8. **Release record** documented in docs/release/

### Production Deployment Checklist

Before merging to main:

- [ ] Feature branch builds successfully on Vercel preview
- [ ] All GitHub CI checks pass (GitHub Actions)
- [ ] Claude review APPROVED (no blocking findings)
- [ ] No P0 security issues
- [ ] No P1 issues (escalated by Claude)
- [ ] Relevant dependencies merged (e.g., Supabase schema if API touches database)
- [ ] Test coverage adequate (unit + integration tests)
- [ ] Rollback plan documented
- [ ] Deployment documented in docs/release/production-deployment.md

---

## Build & Deployment Logs

### Access Build Logs

**Vercel Dashboard**:
1. Go to https://vercel.com/stechai/stecha-
2. Click "Deployments" tab
3. Find deployment by timestamp or commit SHA
4. Click deployment row → "Logs" → view build output

**Build Log Sections**:
```
1. Cloning repository
2. Installing dependencies (npm ci)
3. Running build (npm run build)
4. Uploading build artifacts
5. Creating production bundle
6. Deployment complete ✓
```

**Expected Build Duration**: 2-5 minutes (depending on dependency graph)

### Common Build Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `npm ERR! code E404` | Package not found | Check package-lock.json, run `npm install` locally |
| `next build` timeout | Large build, memory limit | Check for circular dependencies, optimize imports |
| `Module not found` | Missing import path | Verify file path is correct and committed |
| `PostCSS error` | CSS build failure | Check Tailwind config, CSS syntax |

---

## Deployment Status Checks

### GitHub Integration

When a PR is opened, Vercel automatically adds status checks:

```
✓ Vercel (stechai) — Preview ready
  https://feature-[name]--stechai.vercel.app

✓ Vercel (stechai) — Preview building...
  → Builds (2m 34s)

✓ Vercel (stechai) — Preview built
  → Deployment URL available
```

### Vercel Dashboard Signals

**Deployment Status Colors**:
- 🟢 **Green**: Deployment successful, live
- 🟡 **Yellow**: Build in progress
- 🔴 **Red**: Build failed, deployment cancelled
- ⚪ **Gray**: Queued, waiting for resources

---

## Environment Variable Verification

### Preview Environment Variables

```bash
# Verify preview is using test credentials
# (Do NOT hardcode or log actual keys in test code)

# 1. Create simple test endpoint
# pages/api/health.ts:
// export default function handler(req, res) {
//   return res.status(200).json({
//     env: process.env.NODE_ENV,
//     supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
//     openaiKey: process.env.OPENAI_API_KEY ? '***present***' : '***missing***'
//   })
// }

# 2. Test on preview deployment
curl https://feature-[name]--stechai.vercel.app/api/health
# Expected: NODE_ENV = "preview", keys marked as "***present***"
```

### Production Environment Variables

Environment variables in production are:
- ✅ Set in Vercel dashboard (Settings → Environment Variables)
- ✅ Loaded at build time for public vars (NEXT_PUBLIC_*)
- ✅ Loaded at runtime for secret vars
- ✅ Never logged or exposed in error messages
- ❌ Never committed to repository
- ❌ Never visible in Vercel deployment logs

---

## Security Headers Verification

### Expected Security Headers

```bash
# Test production deployment
curl -I https://stechai.app

# Expected headers:
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: (configured per team)
```

### Verify Headers on Preview

```bash
curl -I https://feature-[name]--stechai.vercel.app
# Same security headers as production
```

---

## Domain & SSL/TLS Verification

### Domain Verification

```bash
# 1. Verify DNS is configured
dig stechai.app +short
# Expected: cname.vercel.com or Vercel IP

# 2. Verify HTTPS works
curl -I https://stechai.app
# Expected: HTTP 200, no certificate warnings

# 3. Verify redirect (HTTP → HTTPS)
curl -I http://stechai.app
# Expected: 308/301 redirect to https://stechai.app
```

### SSL/TLS Certificate

```bash
# Check certificate expiration
openssl s_client -connect stechai.app:443 -showcerts | grep "Not After"
# Expected: Expiration > 30 days away
# (Vercel auto-renews before expiration)
```

---

## Monitoring & Alerts

### Real-Time Monitoring

**Vercel Dashboard Metrics**:
- Build duration (target: < 5 min)
- Deployment success rate (target: 99%+)
- Live preview URL status
- Recent deployments (last 10)

**Health Checks**:
```bash
# Ping production deployment
curl -s https://stechai.app/api/health | jq .

# Expected response:
# { "status": "healthy", "timestamp": "2026-10-04T..." }
```

### Alert Configuration

**Recommended Alerts** (configured in Vercel):
- ✓ Build failure
- ✓ Deployment failure
- ✓ SSL certificate expiration warning
- ✓ High error rate on deployment

---

## Smoke Tests

### Basic Smoke Test Suite

Run after production deployment to verify core functionality:

```bash
#!/bin/bash

PROD_URL="https://stechai.app"

# Test 1: Homepage loads
echo "Test 1: Homepage"
curl -s "$PROD_URL" | grep -q "<!DOCTYPE html" && echo "✓" || echo "✗"

# Test 2: API endpoint responsive
echo "Test 2: API Health"
curl -s "$PROD_URL/api/health" | jq .status | grep -q "healthy" && echo "✓" || echo "✗"

# Test 3: Static assets load
echo "Test 3: Static Assets"
curl -I "$PROD_URL/_next/static/*.js" 2>&1 | grep -q "200\|304" && echo "✓" || echo "✗"

# Test 4: No 5xx errors in last 5 min
echo "Test 4: Error Rate"
# (Requires Sentry or similar integration)
echo "✓ (Manual: check Sentry dashboard)"

# Test 5: Response time acceptable
echo "Test 5: Response Time"
time curl -s "$PROD_URL" > /dev/null
# Expected: < 2 seconds
```

---

## Deployment Records

### Successful Deployment Record

After production deployment:

```markdown
## Production Deployment - 2026-10-04

**Commit SHA**: abc123def456...  
**Branch**: main  
**Triggered**: PR #[number] merged  
**Build Duration**: 2m 45s  
**Deployment URL**: https://stechai.app  
**Status**: ✓ LIVE  

**Tests**:
- ✓ Homepage loads (< 1s)
- ✓ API /health returns 200
- ✓ Static assets cached
- ✓ Security headers present
- ✓ No 5xx errors (5min)
- ✓ Error rate < 0.1%

**Rollback Plan**: [documented in docs/release/]

**Signed**: User approval at https://...
```

---

## Vercel Project Settings (Reference)

**Project Name**: STECHA- AI  
**Repository**: hakimceliker/STECHA-  
**Framework**: Next.js  
**Node.js Version**: 20.x  
**Package Manager**: npm  
**Build Command**: `npm run build`  
**Output Directory**: `.next`  
**Install Command**: `npm ci`  
**Development Command**: `npm run dev`  
**Root Directory**: ./  
**Include source maps**: No (for production)  

---

## Known Limitations

1. **Build Time**: Large dependency trees can exceed 10 minutes
2. **Memory**: Vercel preview deployments limited to 1GB
3. **Execution**: Serverless functions (API routes) timeout at 30 seconds
4. **Storage**: No persistent disk between deployments (use Supabase or S3)
5. **Environment**: Node.js environment only (no system packages)

---

**Team**: Vercel  
**Status**: Phase 1, T+4h  
**Next**: Production deployment ready after User approval
