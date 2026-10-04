# Vercel Environment Configuration

**Status**: Phase 1 Implementation  
**Date**: 2026-10-04  
**Team**: Vercel (Deployment & Infrastructure Owner)

---

## Overview

This document specifies environment variable scoping and management for preview and production deployments on Vercel.

---

## Environment Variable Scope

### Preview Environments

Preview deployments (from feature branches) use **test/staging credentials**:

```
NEXT_PUBLIC_SUPABASE_URL=https://preview-stechai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[preview-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[preview-service-role-key]
OPENAI_API_KEY=[test-key-sk-proj-preview-...]
STRIPE_PUBLISHABLE_KEY=pk_test_[preview-stripe-key]
STRIPE_SECRET_KEY=sk_test_[preview-stripe-key]
STRIPE_WEBHOOK_SECRET=whsec_test_[preview-webhook]
INNGEST_EVENT_KEY=[preview-inngest-key]
INNGEST_SIGNING_KEY=[preview-inngest-signing]
SENTRY_DSN=[preview-sentry-dsn-or-empty]
LANGFUSE_PUBLIC_KEY=[preview-langfuse-key-or-empty]
POSTHOG_API_KEY=[preview-posthog-key-or-empty]
NODE_ENV=preview
```

**Preview Workflow**:
1. Feature branch pushed to GitHub
2. Vercel automatically creates preview deployment
3. Preview URL: `https://[branch-name]--stechai.vercel.app`
4. All test credentials used (no production data touched)
5. Automatic cleanup when branch merged or deleted

### Production Environment

Production deployment (main branch) uses **live credentials**:

```
NEXT_PUBLIC_SUPABASE_URL=https://prod-stechai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[production-service-role-key]
OPENAI_API_KEY=[production-key-sk-proj-...]
STRIPE_PUBLISHABLE_KEY=pk_live_[production-stripe-key]
STRIPE_SECRET_KEY=sk_live_[production-stripe-key]
STRIPE_WEBHOOK_SECRET=whsec_live_[production-webhook]
INNGEST_EVENT_KEY=[production-inngest-key]
INNGEST_SIGNING_KEY=[production-inngest-signing]
SENTRY_DSN=[production-sentry-dsn]
LANGFUSE_PUBLIC_KEY=[production-langfuse-key]
POSTHOG_API_KEY=[production-posthog-key]
NODE_ENV=production
```

**Production Workflow**:
1. PR merged to main
2. Vercel builds production deployment
3. Production URL: `https://stechai.app`
4. All production credentials used
5. Deployment requires User approval (AGENTS.md)

---

## Environment Variable Hierarchy

| Variable | Type | Preview | Production | Required | Notes |
|----------|------|---------|------------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Test URL | Production URL | Yes | Exposed in browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Test key | Production key | Yes | Exposed in browser, read-only |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Test role | Production role | Yes | Server-side only, bypass RLS |
| `OPENAI_API_KEY` | Secret | Test key | Production key | Yes | Server-side, API calls |
| `STRIPE_PUBLISHABLE_KEY` | Public | Test pk | Production pk | Yes | Exposed in browser |
| `STRIPE_SECRET_KEY` | Secret | Test sk | Production sk | Yes | Server-side, webhook processing |
| `STRIPE_WEBHOOK_SECRET` | Secret | Test whsec | Production whsec | Yes | Server-side, webhook verification |
| `INNGEST_EVENT_KEY` | Secret | Test key | Production key | Yes | Server-side, event publishing |
| `INNGEST_SIGNING_KEY` | Secret | Test key | Production key | Yes | Server-side, webhook verification |
| `SENTRY_DSN` | Public/Semi | Test DSN | Production DSN | No | Error tracking, exposed in error source maps |
| `LANGFUSE_PUBLIC_KEY` | Semi-secret | Test key | Production key | No | AI trace logging, less sensitive |
| `POSTHOG_API_KEY` | Semi-secret | Test key | Production key | No | Product analytics, less sensitive |
| `NODE_ENV` | Standard | "preview" | "production" | Yes | Controls build/runtime behavior |

### Secret Handling Rules

✅ **DO**:
- Store secrets in Vercel dashboard (Settings > Environment Variables)
- Use separate test vs production keys for all providers
- Rotate secrets annually and when compromised
- Log all secret rotation in docs/secrets/rotation-log.md
- Use preview-only webhooks for test credentials

❌ **DON'T**:
- Commit secrets to GitHub (any branch)
- Use production keys in preview deployments
- Share Vercel dashboard access wider than necessary
- Assume .env.local is safe (always use Vercel dashboard)
- Pass secrets via URL parameters or git commit messages

---

## Deployment Scopes

### Branch-to-Environment Mapping

```
main → Production (stechai.app)
   ↓
   deploy-prod (manual, User approval required)

feature/* → Preview (*.vercel.app)
  ↓
  preview deployments auto-created/destroyed
  
staging → Preview (staging.stechai.app)
   ↓
   deploy-staging (manual, team approval)
```

### Vercel Project Settings

**Project**: STECHA- AI  
**Framework**: Next.js 16.3.6  
**Node.js Version**: 20.x (specified in .nvmrc)  
**Build Command**: `npm run build`  
**Output Directory**: `.next`  
**Development Command**: `npm run dev`  

---

## SSL/TLS Configuration

### Certificates

- **Domain**: stechai.app
- **Certificate Authority**: Let's Encrypt (via Vercel)
- **Auto-renewal**: Enabled (Vercel handles automatic renewal)
- **Expiration**: Automatically renewed 30 days before expiry
- **Monitoring**: Vercel dashboard alerts on certificate issues

### Security Headers

All deployments include hardened security headers (configured in vercel.json):

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Cache-Control: no-store (for /api/*)
```

---

## Custom Domains

### Primary Domain

**Domain**: stechai.app  
**Registrar**: [TBD by User]  
**Nameservers**: [Vercel-managed]  
**HTTPS**: Automatic (Let's Encrypt)  
**Redirects**: All HTTP → HTTPS  

### Verification

```bash
# Verify domain is pointing to Vercel
dig stechai.app

# Expected response includes Vercel's IP/CNAME
# stechai.app CNAME cname.vercel.com
```

---

## Deployment Workflow

### Preview Deployment (Automatic)

```mermaid
Feature Branch → GitHub Push
    ↓
GitHub Webhook → Vercel
    ↓
Vercel Detects New Branch
    ↓
Build: npm run build
    ↓
Deploy to Preview URL
    ↓
Status Check Posted to PR
    ↓
Preview Live (until branch deleted)
```

**Preview URL Format**: `https://feature-branch-name--stechai.vercel.app`

### Production Deployment (Manual)

```mermaid
PR Created (feature/*)
    ↓
GitHub CI Passes
    ↓
Claude Review APPROVED
    ↓
PR Merged to main
    ↓
GitHub Webhook → Vercel
    ↓
Vercel Detects main Push
    ↓
Build: npm run build
    ↓
Deploy to Production
    ↓
Smoke Tests Execute
    ↓
Production Live (stechai.app)
```

**Production Deployment Requires**:
- [✓] GitHub CI passing (all checks green)
- [✓] Claude code review approval
- [✓] Zero P0/P1 security findings
- [ ] User approval (before merge to main)
- [ ] Deployment proof in docs/release/

---

## Rollback Procedure

### Automatic Rollback (Preview)

Preview deployments are automatically cleaned up 30 days after branch deletion. No manual action needed.

### Manual Rollback (Production)

If production deployment is broken:

1. **Identify Last Good Commit**:
   ```bash
   git log --oneline main | head -10
   ```

2. **Create Rollback Branch**:
   ```bash
   git checkout -b rollback/production-revert [last-good-commit-sha]
   ```

3. **Push and Merge**:
   ```bash
   git push -u origin rollback/production-revert
   # Create PR from rollback branch to main
   # After Claude approval, merge to main
   ```

4. **Verify Production**:
   - Check deployment status in Vercel dashboard
   - Run smoke tests
   - Monitor error tracking (Sentry, Langfuse)

---

## Monitoring & Alerts

### Deployment Monitoring

- **Status Page**: https://vercel.com/stechai/status
- **Build Logs**: Available in Vercel dashboard (80 days retention)
- **Real-time Alerts**: Email + Slack (if configured)

### Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Build Duration | < 5 min | > 10 min |
| Deployment Success Rate | 99%+ | < 95% |
| Cold Start Latency | < 2s | > 5s |
| API Response Time | < 500ms | > 1s |
| Error Rate | < 0.1% | > 1% |

---

## Known Issues & Workarounds

### Issue: Environment Variable Not Picking Up

**Cause**: Vercel caches environment variables. Changes require rebuild.

**Workaround**:
1. Go to Vercel dashboard
2. Settings → Environment Variables
3. Update variable value
4. Click "Save"
5. Trigger new deployment (push to main or use "Redeploy" button)

### Issue: Preview Deployment Fails with Timeout

**Cause**: Large dependency graph, slow npm install, or network issues.

**Workaround**:
1. Check build logs for hung step
2. Clear Vercel cache: Settings → Advanced → Purge Cache
3. Re-run deployment (click "Redeploy")
4. If persistent, escalate to Vercel support

---

## Testing Checklist

Before marking Vercel infrastructure as READY:

- [ ] vercel.json created and merged to main
- [ ] Preview environment variables configured
- [ ] Production environment variables documented (secrets stored in Vercel dashboard)
- [ ] Custom domain (stechai.app) configured and verified
- [ ] SSL/TLS certificate auto-renewal enabled
- [ ] Security headers present in preview deployment
- [ ] Preview deployment successful (feature branch → vercel.app)
- [ ] Production deployment documented (manual approval workflow)
- [ ] Rollback procedure tested (simulated rollback on feature branch)
- [ ] Monitoring alerts configured (build failures, deployment issues)

---

## Next Steps

1. **User Provides Production Secrets**: User delivers production keys for all services (SUPABASE, OPENAI, STRIPE, INNGEST, SENTRY, LANGFUSE, POSTHOG) via secure channel
2. **Secrets Registered in Vercel**: Add production secrets to Vercel dashboard
3. **Production Domain**: Register stechai.app domain and configure nameservers
4. **Phase 2 Integration**: Production deployment ready for merge-to-main workflow

---

**Team**: Vercel  
**Status**: Phase 1, T+4h  
**Next Review**: 2026-10-05 (T+12h checkpoint)
