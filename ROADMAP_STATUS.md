# STECH AI V1 - Roadmap & Phase Status

**Last Updated**: 2026-09-28 UTC  
**Owner**: GPT/Codex  
**Reference**: STECH AI Görev Yetki ve İş Akışı Kanunu v1.1

---

## Project Phases (P0-P4)

### P0: Governance & Skeleton (FOUNDATION)
**Goal**: Establish repo structure, team ownership, CI/CD pipeline, and governance documents.  
**Status**: 🟡 IN PROGRESS (40%)  
**Owner**: GPT/Codex + Claude

#### P0 Deliverables:
- [x] AGENTS.md (team responsibilities)
- [x] CODEOWNERS (folder ownership)
- [x] docs/ folder structure
- [x] .env.example (secret documentation)
- [ ] GitHub Actions CI passing
- [ ] docs/index.md (single source of truth)
- [ ] docs/architecture/decisions.md
- [ ] docs/security/threat-model.md
- [ ] docs/release/production-checklist.md
- [ ] Local development setup docs
- [ ] Dependency graph documented

**P0 Exit Criteria**:
- ✅ GitHub Actions CI green on all workflows
- ✅ All team responsibilities documented
- ✅ Repo structure matches delivery plan
- ✅ Secret handling verified
- ✅ Ready for Phase 1 parallel work

**Blocker**: CI failing (investigating root cause)

---

### P1: Infrastructure (PARALLEL SETUP)
**Goal**: Set up all external services and data models in parallel.  
**Status**: 🔜 PLANNED (0%)  
**Owner**: Respective service owners (Supabase, Vercel, Inngest, etc.)

#### P1 Deliverables (Parallel Tracks):

**Track 1: Database & Auth**
- [ ] Supabase Auth setup (email/password, magic link)
- [ ] Database schema v1 (restaurants, users, reservations, orders)
- [ ] RLS policies (row-level security)
- [ ] Storage buckets (images, documents)
- [ ] Migration files (supabase/migrations/)
- [ ] Seed data (test data for dev)
- [ ] Policy tests
- **Deliverable**: docs/delivery/supabase-report.md

**Track 2: Deployment & Environment**
- [ ] Vercel project created
- [ ] Preview environment active
- [ ] Environment variable scope defined
- [ ] vercel.json configured
- [ ] Build pipeline tested
- [ ] Preview URLs working
- **Deliverable**: docs/delivery/vercel-report.md

**Track 3: Workflow Orchestration**
- [ ] Inngest project created
- [ ] Event schema defined
- [ ] Workflow skeleton (booking, payment, notifications)
- [ ] Retry & checkpoint logic
- [ ] Local testing setup
- **Deliverable**: docs/delivery/inngest-report.md

**Track 4: AI Provider Integration**
- [ ] Provider adapter (OpenAI/Anthropic)
- [ ] Model selection (gpt-4-turbo, claude-opus)
- [ ] Structured output schema
- [ ] Prompt templates
- [ ] Timeout & fallback logic
- [ ] Cost estimation
- **Deliverable**: docs/delivery/ai-provider-report.md

**Track 5: Payment Setup**
- [ ] Stripe test account setup
- [ ] Product/price configuration
- [ ] Webhook URL setup
- [ ] Test card scenarios
- [ ] Idempotency logic
- **Deliverable**: docs/delivery/stripe-report.md

**Track 6: Observability**
- [ ] Sentry project created
- [ ] PostHog event schema
- [ ] Error boundary setup
- [ ] Trace schema (Langfuse)
- [ ] Alert rules defined
- **Deliverable**: docs/delivery/observability-report.md

**Track 7: Design Reference**
- [ ] 5+ screens designed (Figma/Visily)
- [ ] Component states (default, loading, error, empty)
- [ ] Design tokens
- [ ] Mobile responsive
- [ ] Dev handoff notes
- **Deliverable**: docs/delivery/design-report.md & design link

**P1 Exit Criteria**:
- ✅ All parallel tracks READY (deliver docs/delivery/*-report.md)
- ✅ API contracts drafted (based on Supabase schema)
- ✅ GPT/Codex review all reports
- ✅ Claude security review all integrations
- ✅ Ready for Phase 2 integration

**Duration**: 2-3 weeks (parallel work)  
**Blocker**: Waiting for P0 CI green

---

### P2: First Integration (SEQUENTIAL)
**Goal**: Merge infrastructure → lock API contracts → bind UI & workflows to real data.  
**Status**: 🔜 PLANNED (0%)  
**Owner**: GPT/Codex (integration lead)

#### P2 Deliverables:
- [ ] Merge Supabase migrations to main
- [ ] Verify migration scripts run (local + preview)
- [ ] Define API contracts (REST endpoint specs)
- [ ] Freeze API contracts (notify all teams)
- [ ] Bind UI components to real Supabase data
- [ ] Bind workflows to real events
- [ ] Provider test modes active (OpenAI/Anthropic)
- [ ] Stripe test mode transactions working
- [ ] Local dev stack works end-to-end
- [ ] docs/delivery/gpt-codex-report.md (integration summary)

**P2 Exit Criteria**:
- ✅ API contracts locked (documented in docs/architecture/)
- ✅ UI renders real data from Supabase
- ✅ Workflows execute test scenarios
- ✅ Payment test scenarios pass
- ✅ All teams ready for Phase 3

**Duration**: 1-2 weeks

---

### P3: Security & Quality (QUALITY GATE)
**Goal**: Comprehensive security audit, RLS testing, E2E coverage, performance testing.  
**Status**: 🔜 PLANNED (0%)  
**Owner**: Claude (security lead) + GPT/Codex (tests)

#### P3 Deliverables:
- [ ] Claude full diff review (security + architecture)
- [ ] P0/P1 findings raised & resolved
- [ ] RLS policy test suite (100% coverage)
- [ ] Secret handling audit passed
- [ ] Auth flow E2E tests
- [ ] Reservation flow E2E tests
- [ ] Payment flow E2E tests
- [ ] Error/loading/empty state coverage
- [ ] Performance testing (load times, API latency)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] docs/delivery/claude-report.md (security findings)

**P3 Exit Criteria**:
- ✅ All P0/P1 findings closed
- ✅ E2E test coverage ≥ 80%
- ✅ RLS policies verified
- ✅ No PII exposure
- ✅ Performance acceptable (< 3s page load)
- ✅ Claude final approval
- ✅ Ready for Phase 4 release

**Duration**: 1-2 weeks

---

### P4: Release (PRODUCTION)
**Goal**: Production deployment, monitoring, go/no-go decision.  
**Status**: 🔜 PLANNED (0%)  
**Owner**: Vercel (deployment) + User (approval)

#### P4 Deliverables:
- [ ] User provides production secrets (Stripe, Supabase, OpenAI, etc.)
- [ ] User provides service account approvals
- [ ] Vercel production deployment
- [ ] Production domain configured
- [ ] SSL certificate active
- [ ] Health checks passing
- [ ] Smoke test suite executed
- [ ] Monitoring dashboards live (Sentry, PostHog)
- [ ] Rollback procedure tested
- [ ] Final release report (docs/release/final-report.md)

**P4 Exit Criteria**:
- ✅ Production URL accessible and healthy
- ✅ Smoke tests passing
- ✅ Monitoring data flowing
- ✅ User go/no-go approval received
- ✅ Release declared: LIVE

**Duration**: 1 week

---

## Dependency Map

```
P0 (Governance)
  ├─ GitHub Actions CI green ← BLOCKER
  ├─ AGENTS.md, CODEOWNERS, docs/ ✓
  └─ Ready to start P1

P1 (Parallel Infrastructure) ← Depends on P0
  ├─ Track 1: Supabase (auth, db, RLS)
  ├─ Track 2: Vercel (preview, env)
  ├─ Track 3: Inngest (workflows)
  ├─ Track 4: AI Provider (adapter)
  ├─ Track 5: Stripe (payments)
  ├─ Track 6: Observability (errors, events)
  ├─ Track 7: Design (UI reference)
  └─ All tracks READY → P2

P2 (First Integration) ← Depends on P1
  ├─ Merge Supabase migrations
  ├─ Freeze API contracts
  ├─ Bind UI to real data
  ├─ Bind workflows to real events
  └─ All integrated READY → P3

P3 (Security & Quality) ← Depends on P2
  ├─ Claude full review
  ├─ RLS policy tests
  ├─ E2E test coverage
  ├─ Performance audit
  └─ All P0/P1 findings closed → P4

P4 (Release) ← Depends on P3
  ├─ User secrets & approvals
  ├─ Vercel production deploy
  ├─ Smoke tests passing
  └─ RELEASED
```

---

## Timeline Estimate

| Phase | Duration | Start Date | End Date | Status |
|-------|----------|-----------|----------|--------|
| P0 | 2-3 weeks | 2026-09-28 | ~2026-10-12 | 🟡 IN PROGRESS |
| P1 | 2-3 weeks | ~2026-10-12 | ~2026-11-02 | ⏳ AWAITING P0 |
| P2 | 1-2 weeks | ~2026-11-02 | ~2026-11-16 | ⏳ AWAITING P1 |
| P3 | 1-2 weeks | ~2026-11-16 | ~2026-11-30 | ⏳ AWAITING P2 |
| P4 | 1 week | ~2026-11-30 | ~2026-12-07 | ⏳ AWAITING P3 |

**Total Project Duration**: ~12-16 weeks from governance start

---

## Critical Success Factors

1. **CI Must Turn Green** (P0 blocker) - Without this, Phase 1 cannot start
2. **Phase 0 Complete Before P1** - Teams cannot parallelize until governance is clear
3. **API Contracts Lock Before UI Binds** - Data consistency requires this order
4. **Security Review Before Release** - Claude review is gate for Phase 4
5. **User Approval Required for Production** - No deployment without explicit approval + secrets

---

## Risk Factors

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| CI failure root cause difficult to debug | MEDIUM | HIGH | Access CI logs, check GitHub docs |
| Teams blocked waiting for API contracts | MEDIUM | MEDIUM | Finalize contracts in early P2 |
| RLS policy complexity | MEDIUM | HIGH | Test with real user scenarios |
| Payment test mode limitations | LOW | MEDIUM | Plan Stripe test scenarios early |
| Performance at scale | MEDIUM | MEDIUM | Load testing in Phase 3 |
| Missing PII filtering | LOW | CRITICAL | Claude security review catches |

---

## Quality Gates

Each phase must satisfy exit criteria before proceeding:

- **P0 Exit**: CI green + governance docs complete
- **P1 Exit**: All service reports ready + all tracks READY status
- **P2 Exit**: API contracts locked + E2E happy path works
- **P3 Exit**: All findings closed + test coverage ≥ 80%
- **P4 Exit**: Production live + monitoring active + user approval

**No skipping phases. No partial releases.**

---

## References

- Governance Law: STECH AI Görev Yetki ve İş Akışı Kanunu v1.1
- Delivery Plan: STECH AI V1 - Görev dağılımı ve teslim planı
- Team Structure: [AGENTS.md](AGENTS.md)
- Current Status: [docs/index.md](docs/index.md)

---

**Status Last Updated**: 2026-09-28  
**Next Review**: When P0 completes (CI green)
