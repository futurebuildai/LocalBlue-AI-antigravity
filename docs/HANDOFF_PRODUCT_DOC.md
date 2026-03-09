# LocalBlue — Product Documentation (Handoff)

**Prepared for:** Antigravity Development Team
**Date:** March 2026
**Source:** Replit Prototype Build

---

## 1. Product Overview

**LocalBlue** is a multi-tenant SaaS platform that enables local contractors (plumbers, electricians, HVAC, roofers, etc.) to build professional, lead-generating websites in ~5 minutes via an AI-powered chat onboarding flow. The platform's core differentiator is **white-label site management** — contractors manage their websites from their own custom domain (e.g., `admin.smithplumbing.com`), creating a seamless brand experience where LocalBlue is invisible to their customers.

**North Star Vision:** Become the default digital presence platform for the trades industry.

**Mission:** Empower every local contractor to have a professional online presence that generates leads — without technical skills, design expertise, or ongoing maintenance burden.

---

## 2. Current Build Status

### What Is Built (Functional)

| Area | Status | Notes |
|------|--------|-------|
| Multi-tenant architecture | Complete | Hostname-based routing with subdomain + custom domain support |
| AI-powered onboarding (12-phase chat) | Complete | Anthropic Claude for content extraction and site generation |
| Website generation from AI chat | Complete | Full page content, SEO metadata, services, testimonials |
| 7 trade-specific templates | Complete | Plumbing, Electrical, HVAC, Roofing, GC, Painting, Landscaping |
| 4 style preferences | Complete | Professional, Bold, Warm, Luxury |
| White-label tenant admin panel | Complete | Dashboard, pages, leads, settings, users |
| Platform admin panel | Complete | Sites management, user management, revenue dashboard, impersonation |
| AI sales chatbot (public sites) | Complete | SSE streaming, lead capture, conversation persistence |
| Quote calculator widget | Complete | Service-based pricing with size/urgency multipliers |
| Appointment scheduler | Complete | Date/time/service selection with contact capture |
| Before/after project slider | Complete | Touch + mouse drag support |
| Project gallery with lightbox | Complete | Filterable by type, full-screen viewing |
| Contact forms with email alerts | Complete | Resend integration for instant notifications |
| Lead CRM system | Complete | Pipeline stages, priority, source tracking, notes, follow-up dates |
| Stripe billing integration | Complete | Checkout, portal, subscription management, webhook processing |
| Custom domain DNS (Cloudflare) | Complete | Automated CNAME management for publishing |
| SEO (meta, OG, JSON-LD) | Complete | Dynamic per-site with `useSeo` hook |
| Analytics tracking | Complete | Page views, visitors, devices, referrers, daily rollups |
| AI-powered SEO optimization | Complete | Platform admin-triggered, cross-site learning |
| Photo upload system | Complete | Logo, team, project, before/after, hero, service categories |
| Mobile-responsive design | Complete | Full mobile optimization with sticky CTAs |
| Iterative site feedback | Complete | Users can request AI content regeneration |
| Signup + site auto-creation | Complete | Email/password signup creates site + subdomain |

### What Is Partially Built

| Area | Status | Notes |
|------|--------|-------|
| Appointment management UI | Backend only | API routes exist, no tenant admin UI for managing appointments |
| Analytics dashboard (tenant) | In progress | Data collection works, dashboard needs refinement |

### What Is Not Built (Planned Features)

See `docs/NORTH_STAR.md` Section 12 (Product Roadmap) and `docs/PRODUCT_MEMO.md` for full roadmap. Key items:

- AI-powered drag-and-drop page editor (Premium tier)
- Multi-location support
- Reputation management (review collection)
- Google Ads integration
- Mobile app for lead alerts
- Reseller/agency program
- Google Business Profile sync
- Automated email follow-up sequences
- Blog/content management
- Role-based access control (tenant roles: Owner/Admin/Editor/Viewer)
- Row-level security at database level
- Rate limiting and CSRF protection

---

## 3. Technical Architecture

### Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript | React 18 |
| Build Tool | Vite | 7.x |
| Routing (client) | wouter | 3.x |
| Data Fetching | TanStack React Query | v5 |
| UI Components | shadcn/ui (Radix primitives) | Latest |
| Styling | Tailwind CSS | 3.x |
| Animations | framer-motion | 11.x |
| Forms | react-hook-form + zod | Latest |
| Icons | lucide-react | Latest |
| Backend | Express.js (Node.js) | Express 5 |
| ORM | Drizzle ORM | 0.39.x |
| Database | PostgreSQL (Neon-backed) | Latest |
| AI | Anthropic Claude (SDK) | 0.72.x |
| Email | Resend | 4.x |
| Payments | Stripe + stripe-replit-sync | 20.x |
| DNS | Cloudflare API | REST API |
| Auth (Platform) | OpenID Connect (Replit Auth) | passport + openid-client |
| Auth (Tenant) | bcrypt + express-session | Custom implementation |
| Session Store | PostgreSQL (connect-pg-simple) | Latest |
| Language | TypeScript | 5.6 |

### Monorepo Structure

```
localblue/
├── client/                          # Frontend (React SPA)
│   ├── index.html                   # HTML entry
│   └── src/
│       ├── App.tsx                  # Root: domain detection, routing, providers
│       ├── main.tsx                 # React mount
│       ├── index.css                # Tailwind config + theme variables
│       ├── assets/images/trades/    # Trade-specific hero images
│       ├── components/
│       │   ├── ui/                  # 40+ shadcn/ui components
│       │   ├── ChatBot.tsx          # AI chatbot widget
│       │   ├── QuoteCalculator.tsx  # Quote estimation tool
│       │   ├── AppointmentScheduler.tsx
│       │   ├── BeforeAfterSlider.tsx
│       │   ├── ProjectGallery.tsx
│       │   ├── StylePicker.tsx      # Onboarding style selector
│       │   ├── PageSelector.tsx     # Onboarding page picker
│       │   ├── PhotoUpload.tsx      # Image upload
│       │   ├── OnboardingProgress.tsx
│       │   ├── TenantAdminLayout.tsx # Sidebar layout
│       │   ├── DomainSetup.tsx      # Custom domain config
│       │   ├── PublishButton.tsx
│       │   ├── ServiceAreaMap.tsx
│       │   ├── Logo.tsx
│       │   ├── TypewriterText.tsx
│       │   ├── AnimatedSection.tsx
│       │   ├── FloatingIcons.tsx
│       │   ├── VideoModal.tsx
│       │   └── ErrorBoundary.tsx
│       ├── contexts/
│       │   └── PreviewContext.tsx    # Editor ↔ preview state
│       ├── hooks/
│       │   ├── use-auth.ts          # Platform auth hook
│       │   ├── use-toast.ts
│       │   ├── use-mobile.tsx
│       │   ├── use-scroll-animation.ts
│       │   ├── use-scroll-spy.ts
│       │   └── use-seo.ts          # Dynamic SEO meta tags
│       ├── lib/
│       │   ├── queryClient.ts       # TanStack Query config + apiRequest helper
│       │   ├── auth-utils.ts        # Domain detection, auth helpers
│       │   ├── message-utils.tsx    # Chat message formatting
│       │   └── utils.ts            # cn() and general utils
│       └── pages/
│           ├── admin/               # Platform admin pages
│           │   ├── Dashboard.tsx
│           │   ├── Sites.tsx
│           │   ├── SiteDetail.tsx
│           │   ├── Users.tsx
│           │   └── Revenue.tsx
│           ├── tenant-admin/        # Tenant admin pages
│           │   ├── Login.tsx
│           │   ├── Dashboard.tsx
│           │   ├── Settings.tsx
│           │   ├── Pages.tsx
│           │   ├── PageEditor.tsx
│           │   ├── Leads.tsx
│           │   └── TenantUsers.tsx
│           ├── Landing.tsx          # Marketing landing page
│           ├── SignUp.tsx
│           ├── Login.tsx
│           ├── Onboarding.tsx       # AI onboarding flow
│           ├── Demo.tsx
│           ├── PublicSite.tsx       # Public site renderer
│           ├── PreviewSite.tsx
│           ├── PreviewAdmin.tsx
│           ├── TenantImpersonate.tsx
│           └── not-found.tsx
├── server/                          # Backend (Express)
│   ├── index.ts                     # Entry: Express setup, middleware chain, Stripe init
│   ├── routes.ts                    # All API route definitions
│   ├── storage.ts                   # IStorage interface + DatabaseStorage implementation
│   ├── db.ts                        # Drizzle + pg pool connection
│   ├── static.ts                    # Production static file serving
│   ├── vite.ts                      # Vite dev server integration
│   ├── cloudflare.ts                # Cloudflare DNS API
│   ├── stripeClient.ts              # Stripe SDK + stripe-replit-sync init
│   ├── stripeRoutes.ts              # Billing API routes
│   ├── webhookHandlers.ts           # Stripe webhook processing
│   ├── seed.ts                      # Database seed data
│   ├── seed-stripe-products.ts      # Stripe product seeding
│   ├── middleware/
│   │   └── tenantMiddleware.ts      # Tenant detection, auth guards
│   ├── services/
│   │   └── email.ts                 # Resend email service
│   └── replit_integrations/         # Replit-specific integration wrappers
│       ├── auth/                    # OIDC auth (replitAuth.ts, routes.ts, storage.ts)
│       ├── batch/                   # Batch operations
│       └── chat/                    # AI chat integration
├── shared/                          # Shared between frontend & backend
│   ├── schema.ts                    # Drizzle schema, Zod schemas, types, enums
│   ├── tradeTemplates.ts            # Trade configs, style templates, page definitions
│   └── models/
│       └── auth.ts                  # Auth user/session table defs
├── docs/                            # Product documentation
├── script/
│   └── build.ts                     # Production build script
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
├── postcss.config.js
└── components.json                  # shadcn/ui config
```

### Multi-Tenant Architecture

The entire app is served from a single Express process. The frontend `App.tsx` uses a `detectDomainType(hostname)` function to determine which "shell" to render:

```
Incoming Request (hostname)
         │
         ▼
    ┌────────────────────┐
    │ detectDomainType() │
    └────────┬───────────┘
             │
    ┌────────┼────────────────┐
    │        │                │
    ▼        ▼                ▼
  'main'   'tenantAdmin'   'tenantPublic'

  Main Platform    Tenant Admin      Public Site
  (localblue.co)   (admin.sub.*)    (sub.* / custom)
  - Landing        - Dashboard       - Hero
  - Signup         - Page Editor     - Services
  - Onboarding     - Leads CRM      - Contact
  - Platform Admin - Settings        - Chatbot
```

**Backend Middleware Stack (order matters):**
1. `POST /api/stripe/webhook` with `express.raw()` (BEFORE json parsing)
2. `express.json()` + `express.urlencoded()`
3. Request logging middleware
4. `express-session` (PostgreSQL store, 7-day TTL)
5. `Passport.js` (OIDC strategy, gated to main domain only)
6. `tenantMiddleware` (hostname → site lookup, attaches `req.site`, `req.tenantId`)
7. Route-level: `requirePlatformAdmin`, `requireTenantAdmin`, `requireTenant`

### Authentication

Two separate auth systems share the same PostgreSQL session table:

| System | Method | Users Table | Domain Scope |
|--------|--------|------------|-------------|
| Platform Admin | Replit Auth (OIDC) via Passport | `users` | Main domain only |
| Tenant Admin | Email/password (bcrypt) | `tenant_users` | `admin.*` subdomains |

**Important Replit-Specific Note:** Platform admin auth currently uses Replit's OIDC provider. When migrating off Replit, you will need to replace this with your own OIDC provider (Auth0, Clerk, Supabase Auth, etc.) or a custom email/password system. The tenant auth system (bcrypt + sessions) is fully portable as-is.

### API Credential Patterns

The Replit build uses two patterns for credentials:

1. **Replit Connectors** (Stripe, Resend): Credentials are fetched at runtime from Replit's internal connector API (`https://{hostname}/api/v2/connection`). These need to be replaced with standard environment variables.
2. **Environment Variables** (Anthropic, Cloudflare): Standard `process.env.*` pattern, fully portable.

---

## 4. Database Schema

### Core Tables

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `sites` | Central tenant entity — contractor website config | Root of all tenant data |
| `tenant_users` | Contractor admin accounts | FK → sites |
| `users` | Platform admin accounts (Replit Auth) | Standalone |
| `sessions` | Express session store | Standalone |
| `pages` | CMS content pages (JSON content) | FK → sites |
| `leads` | Contact submissions + CRM data | FK → sites |
| `lead_notes` | Activity log per lead | FK → leads, sites |
| `onboarding_progress` | AI onboarding state (1:1 with site) | FK → sites |
| `conversations` | AI onboarding chat sessions | FK → sites |
| `messages` | Individual chat messages | FK → conversations |
| `site_photos` | Uploaded images by category | FK → sites |
| `testimonials` | Customer reviews | FK → sites |
| `service_pricing` | Quote calculator config | FK → sites |
| `appointments` | Booking requests | FK → sites |
| `chatbot_conversations` | Public AI chat sessions | FK → sites |
| `analytics_events` | Raw page view tracking | FK → sites |
| `analytics_daily` | Daily aggregated metrics | FK → sites |
| `seo_metrics` | SEO keyword performance | FK → sites |
| `seo_optimizations` | Applied SEO changes | FK → sites |

**Stripe-synced tables** (auto-managed by `stripe-replit-sync`):
- `stripe.products`, `stripe.prices`, `stripe.subscriptions`, `stripe.customers`, `stripe.payment_intents`

**Schema definition:** `shared/schema.ts` (Drizzle ORM format)

All tenant data is isolated via `siteId` foreign keys with `onDelete: "cascade"`.

### Key `sites` Table Fields

The `sites` table is large (~30+ columns) and serves as the configuration hub:

- **Identity:** `subdomain`, `customDomain`, `businessName`, `tradeType`, `tradeLabel`
- **Style:** `brandColor`, `stylePreference`, `selectedPages`
- **Business Info:** `ownerName`, `phone`, `email`, `address`, `serviceArea`, `serviceAreaCities`, `aboutContent`, `tagline`, `uniqueSellingPoints`, `yearsInBusiness`, `totalYearsExperience`
- **Services:** `services` (jsonb array)
- **Billing:** `subscriptionPlan`, `trialPhase`, `trialStartDate`, `trialEndDate`, `hasCreditCard`, `billingPeriod`, `stripeCustomerId`
- **Chatbot:** `chatbotEnabled`, `chatbotPersonality`, `chatbotInitialMessage`
- **Status:** `isPublished`

---

## 5. API Reference

### Platform Admin Routes (`requirePlatformAdmin`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/sites` | List all sites |
| GET | `/api/admin/sites/enhanced` | Sites with enriched metrics |
| GET | `/api/admin/sites/:id` | Single site details |
| POST | `/api/admin/sites` | Create site |
| PATCH | `/api/admin/sites/:id` | Update site |
| DELETE | `/api/admin/sites/:id` | Delete site |
| GET | `/api/admin/sites/:siteId/details` | Full site view (leads, pages, users, photos) |
| POST | `/api/admin/sites/:siteId/impersonate` | Generate impersonation JWT |
| GET | `/api/admin/revenue` | Revenue dashboard data |
| POST | `/api/admin/seo/run-optimization` | Trigger AI SEO optimization |

### Tenant Auth Routes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/tenant/auth/login` | Email/password login |
| POST | `/api/tenant/auth/logout` | Logout |
| GET | `/api/tenant/auth/me` | Current user + site context |
| GET | `/api/tenant/impersonate` | Validate impersonation token |

### Tenant Admin Routes (`requireTenantAdmin`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/tenant/settings` | Site settings |
| PATCH | `/api/tenant/settings` | Update settings |
| PATCH | `/api/tenant/settings/domain` | Update custom domain |
| POST | `/api/tenant/publish` | Toggle publish + Cloudflare DNS |
| GET/POST | `/api/tenant/users` | List/create tenant users |
| GET | `/api/tenant/pages` | List pages |
| GET/PATCH | `/api/tenant/pages/:slug` | Get/update page content |
| GET | `/api/tenant/leads` | List leads (filterable) |
| GET | `/api/tenant/analytics/summary` | Analytics metrics |

### Public Site Routes (`requireTenant`, no auth)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/site/leads` | Submit contact form |
| POST | `/api/site/chat` | AI chatbot (SSE streaming) |
| POST | `/api/site/chat/lead` | Capture lead from chat |
| GET | `/api/site/chat/history` | Chatbot history |
| POST | `/api/site/analytics` | Track page views |
| POST | `/api/site/feedback` | Site content feedback |

### Onboarding Routes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/onboarding/chat` | AI conversation |
| GET/POST | `/api/onboarding/photos` | Photo management |
| POST | `/api/onboarding/generate-site` | AI site generation |

### Stripe/Billing Routes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/stripe/publishable-key` | Client key |
| GET | `/api/stripe/products` | Subscription tiers |
| POST | `/api/stripe/checkout` | Create checkout session |
| POST | `/api/stripe/portal` | Billing portal |
| GET | `/api/stripe/subscription/:siteId` | Subscription status |

### Other

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/signup` | New contractor signup |
| POST | `/api/contact-sales` | Sales inquiry form |
| POST | `/api/feedback` | Beta feedback |
| GET | `/api/auth/user` | Current platform user |
| GET | `/api/preview/:subdomain/*` | Site preview endpoints |

---

## 6. Third-Party Integrations

### Anthropic Claude (AI)

- **Used For:** Onboarding conversation, website content generation, chatbot responses, SEO optimization
- **Models:** `claude-3-5-sonnet-20241022` (content gen), `claude-sonnet-4-5` (chatbot streaming)
- **Config:** Environment variables `AI_INTEGRATIONS_ANTHROPIC_API_KEY` and `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`
- **Migration:** Replace env var names with your standard `ANTHROPIC_API_KEY`. The base URL can be removed (it's a Replit proxy).

### Stripe (Payments)

- **Used For:** Subscription billing (3 tiers), checkout sessions, billing portal, webhook processing
- **Config:** Currently uses Replit's connector API to fetch keys. Replace with `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` env vars.
- **Sync:** Uses `stripe-replit-sync` package to auto-sync Stripe data to local PostgreSQL `stripe.*` tables.
- **Products:** 3 tiers — Starter ($49/mo), Growth ($99/mo), Scale ($199/mo), each with annual variants.

### Resend (Email)

- **Used For:** Lead notification emails, welcome emails, sales inquiry notifications, beta feedback
- **Config:** Currently uses Replit's connector API. Replace with `RESEND_API_KEY` and `RESEND_FROM_EMAIL` env vars.
- **Templates:** Inline HTML in `server/services/email.ts`

### Cloudflare (DNS)

- **Used For:** Automated CNAME record management when contractors publish to custom domains
- **Config:** `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID` env vars (already portable)
- **Functions:** `publishSiteDNS()` and `unpublishSiteDNS()` in `server/cloudflare.ts`

---

## 7. Environment Variables Required

### Must Replace (Replit-Specific)

| Variable | Current Source | Replacement |
|----------|--------------|-------------|
| Stripe keys | Replit Connector API | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` |
| Resend keys | Replit Connector API | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| AI keys | Replit integration env | `ANTHROPIC_API_KEY` (remove `AI_INTEGRATIONS_` prefix and `BASE_URL`) |
| `REPLIT_DOMAINS` | Auto-set by Replit | Replace with your deployment domain |
| `REPL_IDENTITY` | Replit internal | Remove (used for connector auth) |
| Auth OIDC | Replit OIDC provider | Replace with Auth0/Clerk/custom OIDC |

### Already Portable

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLOUDFLARE_API_TOKEN` | Cloudflare DNS management |
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone |
| `PLATFORM_ADMIN_EMAILS` | Comma-separated admin email allowlist |
| `SESSION_SECRET` | Express session encryption |
| `PORT` | Server port (default 5000) |

---

## 8. Build & Run

### Development
```bash
npm run dev          # Starts Express + Vite dev server
```

### Production Build
```bash
npm run build        # Runs script/build.ts (esbuild backend + Vite frontend)
npm run start        # NODE_ENV=production node dist/index.cjs
```

### Database
```bash
npm run db:push      # Push schema changes to PostgreSQL via Drizzle Kit
```

### Output Structure
- Backend: `dist/index.cjs`
- Frontend: `dist/public/`

---

## 9. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Single Express process (monolith) | Simplicity for MVP; all three app shells served from one process |
| Hostname-based multi-tenancy | Enables white-label admin panels on custom domains |
| Shared session table for dual auth | Avoids dual-database session management; isolation via cookie domain scoping |
| JSONB for flexible data | Services, content, collected data stored as JSON for schema flexibility |
| `drizzle-kit push` (no migrations dir) | Fast iteration during prototyping; switch to proper migrations for production |
| TanStack Query v5 (object form only) | Modern data fetching with smart caching; 5-min stale time configured |
| wouter over React Router | Smaller bundle, simpler API for client-side routing |

---

## 10. Existing Documentation

The `docs/` directory contains extensive product documentation:

| Document | Purpose | Length |
|----------|---------|--------|
| `PRODUCT_MEMO.md` | Business case, market analysis, pricing strategy, competitive landscape, go-to-market, unit economics | ~600 lines |
| `NORTH_STAR.md` | Complete product spec: user stories, page inventory, user flows, component deep-dives, roadmap, metrics | ~1,440 lines |
| `PLATFORM_ARCHITECTURE.md` | Technical architecture, schema details, API reference, middleware stack, file structure, infrastructure roadmap | ~860 lines |
| `USER_ACCESS.md` | Auth flows, permission matrix, role system proposals, data isolation, security roadmap | ~460 lines |
| `MARKETING_SOURCE_OF_TRUTH.md` | Brand voice, messaging, personas, competitive battle cards, pricing copy, objection handling | ~500 lines |

These documents are comprehensive and should be treated as the canonical reference for product decisions.
