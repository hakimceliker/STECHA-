# STECH AI V1 - Agents, Boundaries & Ownership

Based on **STECH AI V1 Görev dağılımı ve teslim planı** (Delivery Plan v1)

---

## Team Responsibilities & Ownership

### 1. **GPT/Codex** (Primary Code Owner)
**Ownership**: Main code, migrations, API, tests, CI/CD, technical documentation
- **Scope**: 
  - Repository skeleton and CI infrastructure
  - Core application code and API contracts
  - Database migrations (in collaboration with Supabase)
  - Unit and integration tests
  - Build pipeline configuration
  
- **Deliverables**:
  - PR: [feature/codex-*] branch to main
  - Proof: CI passing, test output, review comments addressed
  - Report: `docs/delivery/gpt-codex-report.md`

- **Constraints**: 
  - Does NOT approve own PRs; requires Claude review
  - Does NOT handle secrets; only documents .env.example
  - Does NOT decide production timeline; waits for User approval

---

### 2. **Claude** (Security & Architecture Reviewer)
**Ownership**: Code review, security audit, architectural consistency, PR approval

- **Scope**:
  - Diff review (code quality, patterns, consistency)
  - Security audit (RLS, auth, input validation, secret handling)
  - Architectural alignment (API contracts, data flow)
  - Threat modeling and risk assessment
  
- **Deliverables**:
  - PR Comments: [APPROVED] or findings P0/P1/P2
  - Review evidence: docs/reviews/, docs/security/
  - Report: `docs/delivery/claude-report.md`

- **Constraints**:
  - Does NOT merge PRs; owner merges after approval
  - Does NOT deploy; Vercel handles deployment
  - Does NOT approve own reviews; needs at least one owner

---

### 3. **User** (Product & Legal Owner)
**Ownership**: Business decisions, secrets, payment/account approvals, legal/commercial decisions

- **Scope**:
  - Secret values (via secure panels, never GitHub)
  - Service account credentials (Stripe, Supabase, Vercel, OpenAI, etc.)
  - Payment/pricing decisions
  - Legal & commercial approvals
  - Go/no-go production decision
  
- **Deliverables**:
  - Approval record: `docs/delivery/user-approval.md`
  - Secret status: .env documentation (names, types, sources)
  - Go/no-go decision: docs/release/production-decision.md

- **Constraints**:
  - Does NOT write code
  - Does NOT approve code; Claude does
  - Does NOT deploy; Vercel does
  - Must provide explicit written approval for production

---

### 4. **Supabase** (Database & Auth Owner)
**Ownership**: Authentication, database schema, RLS policies, storage

- **Scope**:
  - Auth policies and user sessions
  - Database migrations (structure, indexes, constraints)
  - Row-Level Security (RLS) policies
  - Storage buckets and policies
  - Backup and restore procedures
  
- **Deliverables**:
  - PR: [feature/supabase-*] with migration files
  - Test evidence: Policy tests, local/preview deployment proof
  - Report: `docs/delivery/supabase-report.md`

- **Constraints**:
  - Waits for Claude security review before merge
  - Does NOT handle payment logic (Stripe)
  - Does NOT manage deployment (Vercel)

---

### 5. **Vercel** (Deployment & Infrastructure Owner)
**Ownership**: Production deployment, environment management, edge functions

- **Scope**:
  - Preview and production environments
  - Environment variable scope and protection
  - Custom domains and SSL
  - Deployment URL and commit tracking
  - Rollback procedures
  
- **Deliverables**:
  - PR: vercel.json configuration
  - Deployment proof: URL + commit SHA + smoke test
  - Report: `docs/delivery/vercel-report.md`

- **Constraints**:
  - Deploys only after User approval
  - Does NOT approve code (Claude does)
  - Does NOT make business decisions (User does)

---

### 6. **Inngest** (Workflow & Reliability Owner)
**Ownership**: Durable workflows, retry logic, event processing

- **Scope**:
  - Workflow definitions and state machines
  - Retry and backoff policies
  - Idempotency keys and checkpoints
  - Dead-letter queues and replay procedures
  - Event schema and contract
  
- **Deliverables**:
  - PR: src/inngest/ with workflows
  - Test evidence: Happy path + failure path tests
  - Report: `docs/delivery/inngest-report.md`

- **Constraints**:
  - Depends on API contracts (waits for GPT/Codex)
  - Does NOT handle external provider calls (provider teams do)

---

### 7. **OpenAI / Anthropic** (AI Provider Owner)
**Ownership**: LLM integrations, provider adapters, prompt management

- **Scope**:
  - Provider adapter interfaces
  - Model selection and versioning
  - Prompt templates and version control
  - Structured output schemas
  - Timeout and fallback logic
  - PII filtering
  
- **Deliverables**:
  - PR: src/ai/ with provider code
  - Test evidence: Example requests/responses, failure tests
  - Report: `docs/delivery/ai-provider-report.md`

- **Constraints**:
  - Requires Claude security review (PII handling)
  - Does NOT handle payments (Stripe does)

---

### 8. **Stripe** (Payments Owner)
**Ownership**: Payment processing, wallet funding, subscription logic

- **Scope**:
  - Checkout and PaymentIntent flows
  - Webhook signature verification
  - Refund and dispute handling
  - Idempotency and retry logic
  - Wallet ledger and balance logic
  - PCI boundary compliance
  
- **Deliverables**:
  - PR: src/payments/ with Stripe code
  - Test evidence: Test card scenarios, webhook replay, refund proof
  - Report: `docs/delivery/stripe-report.md`

- **Constraints**:
  - Requires Claude security review
  - Requires User approval for production account activation
  - Does NOT handle AI logic (provider teams do)

---

### 9. **Visily / Figma** (Design Owner)
**Ownership**: UI design reference, user flows, component states

- **Scope**:
  - Screen designs and prototypes
  - Component states (default, loading, error, empty)
  - Mobile and responsive sizing
  - Design tokens and redlines
  - Dev handoff documentation
  
- **Deliverables**:
  - Figma/Visily link with screens
  - Dev handoff: Screen IDs, token values
  - Report: `docs/delivery/design-report.md`

- **Constraints**:
  - Referenced by UI developers (not blocking other teams)
  - Does NOT write code

---

### 10. **Sentry / Langfuse / PostHog** (Observability Owner)
**Ownership**: Error tracking, AI trace logging, product analytics

- **Scope**:
  - Error boundary setup and error capturing
  - Trace/span definitions for latency tracking
  - Cost tracking for AI calls
  - Feature flag setup
  - Analytics funnel and custom events
  - PII masking policies
  
- **Deliverables**:
  - PR: src/observability/ with event code
  - Test evidence: Dashboard links, test events, PII verification
  - Report: `docs/delivery/observability-report.md`

- **Constraints**:
  - Requires Claude security review (PII handling)
  - Depends on API contracts (waits for GPT/Codex)

---

## Integration Sequence (Phases)

### Phase 0: Governance
- [ ] AGENTS.md (this file) ✓
- [ ] CODEOWNERS (folder ownership)
- [ ] README.md (project overview)
- [ ] .env.example (secret names only)
- [ ] CI/CD pipeline (.github/workflows/)
- [ ] docs/index.md (single source of truth)

### Phase 1: Parallel Infrastructure
- [ ] Supabase: Auth, database schema, RLS
- [ ] Vercel: Preview & environment setup
- [ ] Inngest: Workflow skeleton
- [ ] AI Provider: Adapter interface
- [ ] Stripe: Test mode setup
- [ ] Observability: Event schema
- [ ] Design: Reference screens

### Phase 2: First Integration
- [ ] Supabase migrations merged → API contracts frozen
- [ ] API contracts locked → UI and workflows bind to real data
- [ ] Provider test modes and payment test modes active

### Phase 3: Security & Quality
- [ ] Claude review all changes (P0/P1 findings)
- [ ] RLS policy testing
- [ ] Secret handling audit
- [ ] Error/loading/empty state coverage
- [ ] E2E test suite
- [ ] Performance testing

### Phase 4: Release
- [ ] User provides production secrets & account approvals
- [ ] Vercel production deployment
- [ ] Smoke test execution
- [ ] Final release report

---

## Decision Rights & Conflicts

### Who decides what?

| Decision | Owner | Approver | Notification |
|----------|-------|----------|--------------|
| Code quality | Claude | GPT/Codex | PR comments |
| Security issues | Claude | GPT/Codex | P0/P1 findings |
| Architecture | Claude | User (if > scope) | docs/decisions/ |
| Database schema | Supabase | Claude | PR review |
| API contracts | GPT/Codex | Claude | docs/architecture/ |
| Deployment | Vercel | User | docs/release/ |
| Business logic | User | - | docs/decisions/ |
| Secrets & accounts | User | - | .env.example |

### Blocking Rules

**A team is BLOCKED if**:
- Its dependencies (previous phase) are not READY
- Claude's P0/P1 findings are unresolved
- User approval is pending (for production)

**How to signal BLOCKED**:
1. Add "blocked" label to Issue
2. Document reason: `[BLOCKED] Awaiting [team] on [dependency]`
3. Link blocked Issue in docs/index.md
4. Do NOT wait silently; notify @claude and @user

---

## Delivery Format (Every Team)

Every PR must include in the description:

```markdown
## Delivery Checklist

- [ ] Issue number and scope documented
- [ ] Branch: feature/[team]-[feature]
- [ ] Changes documented (what files changed, why)
- [ ] Test evidence (command + output)
- [ ] Verification proof (screenshot/log link)
- [ ] Rollback procedure documented
- [ ] Known risks listed
- [ ] Next team noted (who will integrate this)
- [ ] Report written: docs/delivery/[team]-report.md
- [ ] Status: READY / BLOCKED / NEEDS_REVIEW
```

---

## File Ownership (CODEOWNERS)

See `CODEOWNERS` for per-folder approval requirements.

---

## References

- Governance Law: STECH AI Görev Yetki ve İş Akışı Kanunu v1.1 (.docx)
- Delivery Plan: STECH AI V1 - Görev dağılımı ve teslim planı (PDF)
- Architecture: docs/architecture/
- Release Process: docs/release/

---

**Last Updated**: 2026-09-28
**Status**: READY (Core teams defined; Phase 0 in progress)
