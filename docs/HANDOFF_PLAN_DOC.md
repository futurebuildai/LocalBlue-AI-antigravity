# LocalBlue — Migration & Completion Plan (Handoff to Antigravity)

**Date:** March 2026
**Context:** Migrating from Replit prototype to production environment

---

## 1. Migration Tasks (Must Do Before Continuing Build)

These are mandatory changes to decouple the app from Replit's infrastructure.

### 1.1 Replace Authentication System

**Priority:** Critical
**Effort:** Medium (1-2 days)

The platform admin auth currently uses Replit's OIDC provider. This must be replaced.

**Files to modify:**
- `server/replit_integrations/auth/replitAuth.ts` — OIDC setup
- `server/replit_integrations/auth/routes.ts` — `/api/auth/user` route
- `server/replit_integrations/auth/storage.ts` — User upsert
- `server/middleware/tenantMiddleware.ts` — `requirePlatformAdmin`, `isTenantDomain()`
- `client/src/hooks/use-auth.ts` — Auth polling hook
- `client/src/App.tsx` — `PlatformAdminGuard` component
- `client/src/pages/Login.tsx` — Login page

**Options:**
1. **Auth0 / Clerk** — Drop-in OIDC replacement, minimal code change
2. **Supabase Auth** — If using Supabase for database
3. **Custom email/password** — Same pattern as tenant auth (bcrypt + sessions), simplest

**Note:** Tenant admin auth (email/password with bcrypt + express-session) is fully portable and requires no changes.

### 1.2 Replace Replit Connector Credential Fetching

**Priority:** Critical
**Effort:** Small (2-4 hours)

Stripe and Resend currently fetch API keys at runtime from Replit's internal connector API. Replace with standard environment variables.

**Files to modify:**
- `server/stripeClient.ts` — Replace connector API calls with `process.env.STRIPE_SECRET_KEY`
- `server/services/email.ts` — Replace connector API calls with `process.env.RESEND_API_KEY`
- `server/stripeRoutes.ts` — Replace publishable key endpoint to use `process.env.STRIPE_PUBLISHABLE_KEY`

**Pattern to replace:**
```typescript
// CURRENT (Replit Connector):
const response = await fetch(`https://${hostname}/api/v2/connection`, {
  headers: { Authorization: `Bearer ${process.env.REPL_IDENTITY}` }
});
const { api_key } = await response.json();

// REPLACEMENT:
const api_key = process.env.STRIPE_SECRET_KEY;
```

### 1.3 Replace Anthropic AI Configuration

**Priority:** Critical
**Effort:** Small (1-2 hours)

**Files to modify:**
- `server/routes.ts` — Anthropic client initialization
- `server/replit_integrations/chat/routes.ts` — Chatbot Anthropic client

**Change:**
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` → `ANTHROPIC_API_KEY`
- Remove `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` (it points to Replit's proxy; use Anthropic directly)

### 1.4 Remove Replit-Specific Vite Plugins

**Priority:** Low
**Effort:** Small (30 min)

**Files to modify:**
- `vite.config.ts` — Remove `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`, `@replit/vite-plugin-runtime-error-modal`
- `package.json` — Remove these dev dependencies

### 1.5 Replace Domain Detection Logic & Decouple Base URLs

**Priority:** High
**Effort:** Medium (4-8 hours)

The domain detection includes Replit-specific hostnames (`.replit.dev`, `.repl.co`) and hardcoded `localblue.co` references throughout. These need to be centralized into environment config.

**Files to modify:**
- `client/src/lib/auth-utils.ts` — `detectDomainType()` function
- `server/replit_integrations/auth/replitAuth.ts` — `isTenantDomain()` function
- `server/middleware/tenantMiddleware.ts` — Hostname matching logic
- `server/index.ts` — `REPLIT_DOMAINS` for webhook URL
- `server/stripeRoutes.ts` — `REPLIT_DOMAINS` for checkout/portal redirect URLs (lines ~106, ~139)
- `server/cloudflare.ts` — Hardcoded `BASE_DOMAIN` constant
- `server/services/email.ts` — Hardcoded URLs in email templates
- `server/routes.ts` — Hardcoded `localblue.co` references in URLs
- `client/src/App.tsx` — Domain detection logic
- `client/src/pages/PreviewAdmin.tsx` — Hardcoded domain references
- `client/src/pages/tenant-admin/Dashboard.tsx` — Hardcoded domain references
- `shared/schema.ts` — Any domain references

**Recommendation:** Create a centralized config with `APP_BASE_DOMAIN`, `APP_ADMIN_SUBDOMAIN_PREFIX`, and `APP_PUBLIC_URL` environment variables, then replace all hardcoded references.

### 1.6 Fix Security Blockers

**Priority:** Critical
**Effort:** Small (2-4 hours)

These must be fixed before any production deployment:

1. **JWT secret fallback:** `server/routes.ts` (lines ~334, ~1183) falls back to `'localblue-secret'` when `SESSION_SECRET` is unset. This default must be removed — the app should refuse to start without a proper `SESSION_SECRET`.

2. **Verify `/api/admin/revenue` auth:** The Stripe revenue route is registered via `registerStripeRoutes(app)` in `server/routes.ts`. Verify that the middleware registration order ensures `requirePlatformAdmin` protects this route. If the Stripe routes are registered before the admin middleware is applied, the revenue endpoint may be unprotected.

3. **Require `SESSION_SECRET` in production:** Add a startup check that throws if `SESSION_SECRET` is not set when `NODE_ENV=production`.

**Files to modify:**
- `server/routes.ts` — Remove `|| 'localblue-secret'` fallback, add required check
- `server/stripeRoutes.ts` — Verify admin middleware is applied to `/api/admin/revenue`
- `server/index.ts` — Add env var validation on startup

### 1.7 Set Up Proper Database Migrations

**Priority:** High
**Effort:** Small (2-4 hours)

Currently uses `drizzle-kit push` (direct schema sync). Set up a proper migration pipeline:

```bash
npx drizzle-kit generate    # Generate migration SQL files
npx drizzle-kit migrate     # Run migrations
```

**Files to modify:**
- `drizzle.config.ts` — Already configured correctly
- Add migration scripts to CI/CD pipeline

### 1.8 Configure Hosting & Deployment

**Priority:** Critical
**Effort:** Medium-Large (varies)

Currently runs on Replit with a single process on port 5000.

**Production considerations:**
- The build output is `dist/index.cjs` (backend) + `dist/public/` (frontend static)
- Express serves both API and static files in production (`server/static.ts`)
- Needs `DATABASE_URL`, all API keys, and `SESSION_SECRET` as env vars
- Stripe webhooks need a publicly accessible URL
- Consider separating frontend (CDN) from backend (API server) in production

---

## 2. Required Environment Variables (Production)

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/localblue

# Authentication
SESSION_SECRET=<random-string>
PLATFORM_ADMIN_EMAILS=admin@localblue.co,admin2@localblue.co

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@localblue.co

# DNS Management
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ZONE_ID=...

# Application
PORT=5000
NODE_ENV=production
APP_BASE_DOMAIN=localblue.co
APP_PUBLIC_URL=https://localblue.co
```

---

## 3. Feature Completion Priorities

### Phase 1 — Foundation Hardening (Immediate)

| Task | Priority | Effort | Details |
|------|----------|--------|---------|
| Rate limiting | Critical | 1 day | Add `express-rate-limit` on all API routes, especially auth and public submission endpoints |
| CSRF protection | Critical | 1 day | Add CSRF tokens for all mutation endpoints |
| Input sanitization audit | High | 1-2 days | Review all user inputs for XSS, SQL injection (Drizzle ORM handles most SQL injection) |
| Error tracking | High | 0.5 day | Add Sentry or similar for production error monitoring |
| Structured logging | High | 1 day | Replace `console.log` with structured JSON logging (pino/winston) |
| Connection pooling | High | 0.5 day | Configure PostgreSQL connection pool limits for production load |
| Content Security Policy | Medium | 0.5 day | Add CSP headers |

### Phase 2 — Tenant Admin Completion

| Task | Priority | Effort | Details |
|------|----------|--------|---------|
| Appointment management UI | High | 2-3 days | Backend routes exist (`/api/tenant/appointments`), need frontend pages in tenant admin |
| Analytics dashboard refinement | High | 2-3 days | Data collection works; polish the tenant-facing dashboard |
| Testimonial management | High | 1-2 days | CRUD UI for tenant admins to manage customer reviews |
| Service pricing configuration | High | 1-2 days | UI for tenant admins to configure quote calculator pricing |
| Subscription management UI | High | 2-3 days | Allow tenants to upgrade/downgrade/cancel via Stripe billing portal |
| Email notification preferences | Medium | 1 day | Let tenants configure which notifications they receive |

### Phase 3 — Role-Based Access Control

See `docs/USER_ACCESS.md` Section 5 for full design. Key tasks:

| Task | Effort | Details |
|------|--------|---------|
| Add `role` column to `tenant_users` | 1 hour | Enum: owner, admin, editor, viewer |
| Update `requireTenantAdmin` middleware | 0.5 day | Accept `requiredRole` parameter with hierarchy check |
| Update frontend guards | 1 day | Show/hide UI elements based on role |
| Seat limits enforcement | 0.5 day | Check against plan limits on user creation |
| Migrate existing users | 1 hour | Backfill all existing tenant_users with role = 'owner' |

### Phase 4 — Growth Features

| Task | Priority | Effort | Details |
|------|----------|--------|---------|
| AI-powered page editor | High | 2-4 weeks | builder.io-style drag-and-drop with AI content assistance |
| Multi-location support | High | 1-2 weeks | Organizations table, parent/child site relationships |
| Reputation management | High | 1-2 weeks | Review collection, display, response automation |
| Google Business Profile sync | Medium | 1 week | API integration for business info sync |
| Blog/content management | Medium | 1 week | Blog post CRUD with SEO optimization |
| Automated email follow-ups | High | 1-2 weeks | Drip campaigns for lead nurturing |
| Mobile app for lead alerts | High | 2-3 weeks | React Native or PWA |

### Phase 5 — Scale & Enterprise

| Task | Priority | Effort |
|------|----------|--------|
| Reseller/agency program | Medium | 3-4 weeks |
| Multi-tenant hierarchy (reseller → contractor → site) | Medium | 2-3 weeks |
| Enterprise SSO (SAML/OIDC) | Low | 1-2 weeks |
| API versioning (v1 prefix) | Medium | 1 week |
| Webhooks outbound (lead notifications) | Medium | 1 week |
| International expansion (i18n, multi-currency) | Low | 3-4 weeks |

---

## 4. Infrastructure Recommendations

### Immediate (MVP → Production)

| Component | Recommendation | Why |
|-----------|---------------|-----|
| Hosting | Railway, Render, or Fly.io | Easy Express deployment, PostgreSQL add-ons |
| Database | Neon or Supabase PostgreSQL | Serverless-friendly, connection pooling built-in |
| CDN | Cloudflare (already integrated) | Static assets + DNS already configured |
| Monitoring | Sentry (errors) + Axiom or Datadog (logs) | Production visibility |
| CI/CD | GitHub Actions | Build, test, deploy pipeline |
| Media storage | Cloudflare R2 or AWS S3 | Photo uploads currently stored as URLs; need proper object storage |

### Growth Stage

| Component | Recommendation |
|-----------|---------------|
| Redis | Session store + API cache + job queues |
| Background jobs | BullMQ (Redis-backed) for email, AI generation, image processing |
| Image processing | Sharp for optimization, thumbnails |
| Search | Consider Meilisearch or Algolia for site search |

### Scale Stage

| Component | Recommendation |
|-----------|---------------|
| Load balancer | Cloudflare or AWS ALB |
| Read replicas | PostgreSQL read replicas for analytics queries |
| Message bus | NATS or Kafka for event-driven architecture |
| Microservices | Split: Auth, Sites, AI, Media, Billing services |

---

## 5. Known Technical Debt

| Issue | Severity | Location | Notes |
|-------|----------|----------|-------|
| No rate limiting | High | All API routes | Critical for production |
| No CSRF protection | High | All mutation endpoints | Security vulnerability |
| Console.log-based logging | Medium | Throughout server/ | Replace with structured logging |
| No automated tests | Medium | Entire codebase | No unit, integration, or e2e tests exist |
| Replit connector credential fetching | High | stripeClient.ts, email.ts | Must replace before deployment |
| `drizzle-kit push` instead of migrations | Medium | drizzle.config.ts | Switch to proper migration files |
| Session store on PostgreSQL | Medium | server/index.ts | Consider Redis for performance at scale |
| No image optimization pipeline | Medium | Photo uploads | Raw images served directly |
| Stripe webhook URL hardcoded to Replit domain | High | server/index.ts | Must update for production domain |
| `stripe-replit-sync` package | Medium | server/stripeClient.ts | Evaluate if this package works outside Replit or needs replacement |
| JWT secret fallback to hardcoded value | High | server/routes.ts (lines ~334, ~1183) | `'localblue-secret'` fallback must be removed |
| Hardcoded `localblue.co` references | Medium | 10+ files across server/client | Centralize into env config (see Section 1.5) |
| `/api/admin/revenue` auth verification needed | High | server/stripeRoutes.ts | Verify middleware registration order protects this route |

---

## 6. Code Quality Notes

### Strengths
- Clean TypeScript throughout (strict mode)
- Well-structured shared schema with Zod validation
- Consistent API patterns (storage interface abstraction)
- Comprehensive Shadcn/ui component library
- Good separation of concerns (routes → storage → database)
- Extensive product documentation

### Areas to Improve
- `server/routes.ts` is very large (~2000+ lines); consider splitting into route modules
- Some AI prompts are very long inline strings; consider extracting to template files
- No error boundary on most frontend routes (only root-level)
- No request validation middleware (validation is inline in route handlers)
- Consider OpenAPI/Swagger spec generation from route definitions

---

## 7. Key Files Reference (Start Here)

When onboarding to this codebase, read these files in order:

1. `shared/schema.ts` — Data model (the source of truth)
2. `shared/tradeTemplates.ts` — Trade configurations and template definitions
3. `server/index.ts` — Server entry point and middleware chain
4. `server/routes.ts` — All API logic
5. `server/storage.ts` — Data access layer
6. `server/middleware/tenantMiddleware.ts` — Multi-tenant logic
7. `client/src/App.tsx` — Frontend routing and domain detection
8. `client/src/lib/queryClient.ts` — API client configuration
9. `client/src/pages/PublicSite.tsx` — How generated sites render
10. `client/src/pages/Onboarding.tsx` — AI onboarding flow

---

## 8. Pricing & Business Model Reference

| Tier | Monthly | Annual | Key Feature |
|------|---------|--------|-------------|
| Starter | $49 | $490/yr | Professional website + standard forms |
| Growth | $99 | $990/yr | + AI Chatbot + calendar sync + 3 seats |
| Scale | $199 | $1,990/yr | + Quote calculator + service maps + unlimited seats |

All plans include unlimited leads. Trial model: 30-day free subdomain → 14-day free with custom domain (CC required).

For full business context, pricing philosophy, competitive analysis, and go-to-market strategy, see:
- `docs/PRODUCT_MEMO.md`
- `docs/MARKETING_SOURCE_OF_TRUTH.md`

---

## 9. Existing Documentation Map

| Document | What It Covers |
|----------|---------------|
| `docs/HANDOFF_PRODUCT_DOC.md` | Complete technical product documentation (this companion doc) |
| `docs/PRODUCT_MEMO.md` | Business case, market analysis, pricing strategy, competitive landscape, GTM |
| `docs/NORTH_STAR.md` | Product spec: all user stories, every page/screen, user flows, component specs, roadmap |
| `docs/PLATFORM_ARCHITECTURE.md` | Technical architecture, full schema, API reference, middleware, infrastructure roadmap |
| `docs/USER_ACCESS.md` | Auth flows, permissions matrix, role system design, security proposals |
| `docs/MARKETING_SOURCE_OF_TRUTH.md` | Brand guidelines, messaging framework, personas, competitive battle cards, copy |
| `replit.md` | Project summary (Replit-specific, can be discarded) |
