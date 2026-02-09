# LocalBlue Platform Architecture

**Document Version:** 1.0
**Last Updated:** February 9, 2026
**Status:** Living Document — Engineering Reference

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LocalBlue Platform Architecture                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐      │
│   │  Main Platform    │  │  Tenant Admin     │  │  Public Sites     │      │
│   │  localblue.co     │  │  admin.theirsite  │  │  theirsite.com    │      │
│   │                   │  │  .com             │  │                   │      │
│   │  - Platform Admin │  │  - Dashboard      │  │  - Landing Page   │      │
│   │  - Sign Up        │  │  - Page Editor    │  │  - Services       │      │
│   │  - Onboarding     │  │  - Lead Mgmt      │  │  - Contact Form   │      │
│   │  - Demo           │  │  - Settings       │  │  - Chatbot        │      │
│   │  - Revenue        │  │  - Users          │  │  - Appointments   │      │
│   └────────┬──────────┘  └────────┬──────────┘  └────────┬──────────┘      │
│            │                      │                      │                  │
│            └──────────────────────┼──────────────────────┘                  │
│                                   │                                         │
│                    ┌──────────────▼──────────────┐                          │
│                    │     Express.js Server        │                          │
│                    │     (Single Process)         │                          │
│                    │     Port 5000                │                          │
│                    │                              │                          │
│                    │  - REST API (/api/*)         │                          │
│                    │  - Vite Dev / Static Serve   │                          │
│                    │  - Tenant Middleware          │                          │
│                    │  - Auth (OIDC + Session)      │                          │
│                    └──────────────┬──────────────┘                          │
│                                   │                                         │
│            ┌──────────────────────┼──────────────────────┐                  │
│            │                      │                      │                  │
│   ┌────────▼──────────┐  ┌───────▼───────────┐  ┌──────▼───────────┐      │
│   │  PostgreSQL       │  │  Anthropic Claude  │  │  External APIs   │      │
│   │  (Neon-backed)    │  │  (AI Integrations) │  │                  │      │
│   │                   │  │                    │  │  - Stripe        │      │
│   │  - App Tables     │  │  - Onboarding AI   │  │  - Resend Email  │      │
│   │  - Sessions       │  │  - Chatbot AI      │  │  - Cloudflare    │      │
│   │  - stripe.* sync  │  │  - Content Gen     │  │    DNS           │      │
│   └───────────────────┘  └────────────────────┘  └──────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Request Flow:**
```
Browser Request
      │
      ▼
  Hostname Detection
      │
      ├── localblue.co / *.replit.dev  ──▶  Main Platform (React SPA)
      │
      ├── admin.{subdomain}.*          ──▶  Tenant Admin Panel (React SPA)
      │
      └── {subdomain}.* / custom       ──▶  Public Site (React SPA)
             domain
```

---

## 2. Current Architecture — Complete State

### 2.1 System Architecture

| Layer           | Technology                                                        |
|-----------------|-------------------------------------------------------------------|
| **Frontend**    | React 18 + Vite, Wouter routing, TanStack React Query v5, Shadcn/ui + Tailwind CSS |
| **Backend**     | Express.js on Node.js, single process serving API + frontend      |
| **Database**    | PostgreSQL (Neon-backed via Replit), Drizzle ORM                  |
| **AI**          | Anthropic Claude Opus 4.5 via Replit AI Integrations              |
| **Email**       | Resend for lead notification and welcome emails                   |
| **Payments**    | Stripe with `stripe-replit-sync` for auto data sync to `stripe.*` schema |
| **Auth**        | Replit Auth (OIDC/Passport) for Platform Admin; bcrypt + express-session for Tenant Admin |
| **Session Store** | PostgreSQL-backed via `connect-pg-simple`                       |
| **DNS**         | Cloudflare API for custom domain management                       |
| **Hosting**     | Replit — single Express server on port 5000                       |

---

### 2.2 Multi-Tenant Architecture

#### Domain Detection Strategy

```
                        Incoming Request (hostname)
                                │
                                ▼
                    ┌───────────────────────┐
                    │  isTenantDomain()     │
                    │  (replitAuth.ts)      │
                    └───────────┬───────────┘
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                   │
             ▼                  ▼                   ▼
    Main Domain           admin.* prefix       Subdomain / Custom
    (localblue.co,        (admin.acme.         Domain Match
     *.replit.dev)         localblue.co)       (acme.localblue.co,
                                                acmedrywall.com)
             │                  │                   │
             ▼                  ▼                   ▼
     Platform Pages      Tenant Admin          Public Site
     (Replit Auth)       (bcrypt session)      (No auth required)
```

**Key Components:**
- **`tenantMiddleware.ts`** — Runs on every request. Looks up site by hostname (custom domain first, then subdomain extraction). Attaches `req.site` and `req.tenantId`.
- **`isTenantDomain()`** — Determines if a hostname belongs to a tenant vs the main platform. Used to gate OIDC routes (login/callback/logout) to main domain only.
- **Auth Isolation** — Replit Auth (OIDC) only operates on the main domain. Tenant domains use email/password auth with bcrypt hashing and express-session.
- **Session Isolation** — Shared PostgreSQL session store (`sessions` table). Platform admin sessions use Passport's `req.user`. Tenant admin sessions use `req.session.userId` + `req.session.siteId`. Cookies scoped to hostname.

---

### 2.3 Database Schema (Current)

#### Core Tables

**`users`** — Replit Auth platform users

| Column          | Type      | Notes                    |
|-----------------|-----------|--------------------------|
| id              | varchar   | PK, gen_random_uuid()    |
| email           | varchar   | unique                   |
| firstName       | varchar   |                          |
| lastName        | varchar   |                          |
| profileImageUrl | varchar   |                          |
| createdAt       | timestamp | default now()            |
| updatedAt       | timestamp | default now()            |

**`sessions`** — Express session store (Replit Auth mandatory)

| Column | Type      | Notes         |
|--------|-----------|---------------|
| sid    | varchar   | PK            |
| sess   | jsonb     | not null      |
| expire | timestamp | not null, idx |

**`tenant_users`** — Contractor admin users

| Column   | Type    | Notes                       |
|----------|---------|-----------------------------|
| id       | varchar | PK, gen_random_uuid()       |
| email    | text    | not null, unique            |
| password | text    | not null (bcrypt hash)      |
| siteId   | varchar | FK → sites.id               |

**`sites`** — Contractor websites (core tenant entity)

| Column                 | Type      | Notes                         |
|------------------------|-----------|-------------------------------|
| id                     | varchar   | PK, gen_random_uuid()         |
| subdomain              | text      | not null, unique              |
| customDomain           | text      |                               |
| businessName           | text      | not null                      |
| brandColor             | text      | default "#3B82F6"             |
| services               | jsonb     | string[]                      |
| isPublished            | boolean   | default false                 |
| subscriptionPlan       | text      | starter/growth/scale          |
| trialPhase             | text      | test_drive/professional_launch/active/expired |
| trialStartDate         | timestamp |                               |
| trialEndDate           | timestamp |                               |
| hasCreditCard          | boolean   |                               |
| billingPeriod          | text      |                               |
| stripeCustomerId       | text      |                               |
| ownerName              | text      |                               |
| phone                  | text      |                               |
| email                  | text      |                               |
| address                | text      |                               |
| yearsInBusiness        | text      |                               |
| totalYearsExperience   | text      |                               |
| serviceArea            | text      |                               |
| serviceAreaCities      | jsonb     | string[]                      |
| tagline                | text      |                               |
| aboutContent           | text      |                               |
| uniqueSellingPoints    | jsonb     | string[]                      |
| tradeType              | text      | enum: TRADE_TYPES             |
| tradeLabel             | text      |                               |
| stylePreference        | text      | professional/bold/warm/luxury |
| selectedPages          | jsonb     | string[]                      |
| chatbotEnabled         | boolean   |                               |
| chatbotPersonality     | text      |                               |
| chatbotInitialMessage  | text      |                               |

**`conversations`** — AI onboarding conversations

| Column    | Type      | Notes                 |
|-----------|-----------|-----------------------|
| id        | serial    | PK                    |
| title     | text      | not null              |
| siteId    | varchar   | FK → sites.id         |
| createdAt | timestamp | default now()         |

**`messages`** — AI conversation messages

| Column         | Type      | Notes                     |
|----------------|-----------|---------------------------|
| id             | serial    | PK                        |
| conversationId | integer   | FK → conversations.id     |
| role           | text      | not null (user/assistant) |
| content        | text      | not null                  |
| createdAt      | timestamp | default now()             |

**`pages`** — Site content pages

| Column    | Type      | Notes             |
|-----------|-----------|-------------------|
| id        | serial    | PK                |
| siteId    | varchar   | FK → sites.id     |
| slug      | text      | not null          |
| title     | text      | not null          |
| content   | jsonb     |                   |
| createdAt | timestamp | default now()     |
| updatedAt | timestamp | default now()     |

**`leads`** — Contact form submissions

| Column    | Type      | Notes             |
|-----------|-----------|-------------------|
| id        | serial    | PK                |
| siteId    | varchar   | FK → sites.id     |
| name      | text      | not null          |
| email     | text      | not null          |
| phone     | text      |                   |
| message   | text      |                   |
| createdAt | timestamp | default now()     |

**`onboarding_progress`** — Onboarding state tracking

| Column          | Type      | Notes             |
|-----------------|-----------|-------------------|
| id              | serial    | PK                |
| siteId          | varchar   | FK → sites.id     |
| currentPhase    | text      | enum: ONBOARDING_PHASES |
| collectedData   | jsonb     |                   |
| completedPhases | jsonb     | string[]          |
| createdAt       | timestamp | default now()     |
| updatedAt       | timestamp | default now()     |

**`site_photos`** — Uploaded project photos

| Column    | Type      | Notes             |
|-----------|-----------|-------------------|
| id        | serial    | PK                |
| siteId    | varchar   | FK → sites.id     |
| type      | text      |                   |
| url       | text      | not null          |
| caption   | text      |                   |
| sortOrder | integer   |                   |
| createdAt | timestamp | default now()     |

**`testimonials`** — Customer reviews

| Column           | Type      | Notes             |
|------------------|-----------|-------------------|
| id               | serial    | PK                |
| siteId           | varchar   | FK → sites.id     |
| customerName     | text      | not null          |
| customerLocation | text      |                   |
| rating           | integer   |                   |
| content          | text      | not null          |
| projectType      | text      |                   |
| isVisible        | boolean   | default true      |
| createdAt        | timestamp | default now()     |

**`service_pricing`** — Service pricing entries

| Column      | Type      | Notes             |
|-------------|-----------|-------------------|
| id          | serial    | PK                |
| siteId      | varchar   | FK → sites.id     |
| serviceName | text      | not null          |
| basePrice   | text      |                   |
| priceUnit   | text      |                   |
| description | text      |                   |
| isActive    | boolean   | default true      |
| createdAt   | timestamp | default now()     |

**`appointments`** — Scheduling requests

| Column         | Type      | Notes             |
|----------------|-----------|-------------------|
| id             | serial    | PK                |
| siteId         | varchar   | FK → sites.id     |
| customerName   | text      | not null          |
| customerEmail  | text      | not null          |
| customerPhone  | text      |                   |
| requestedDate  | text      |                   |
| requestedTime  | text      |                   |
| serviceType    | text      |                   |
| notes          | text      |                   |
| status         | text      | default "pending" |
| createdAt      | timestamp | default now()     |

**`chatbot_conversations`** — Public site chatbot sessions

| Column       | Type      | Notes             |
|--------------|-----------|-------------------|
| id           | serial    | PK                |
| siteId       | varchar   | FK → sites.id     |
| visitorId    | text      |                   |
| messages     | jsonb     |                   |
| createdAt    | timestamp | default now()     |
| updatedAt    | timestamp | default now()     |
| leadCaptured | boolean   |                   |

#### Stripe Synced Tables (auto-managed by `stripe-replit-sync`)

| Table                       | Purpose                              |
|-----------------------------|--------------------------------------|
| `stripe.products`           | Subscription products                |
| `stripe.prices`             | Product pricing tiers                |
| `stripe.subscriptions`      | Active subscriptions                 |
| `stripe.customers`          | Stripe customer records              |
| `stripe.payment_intents`    | Payment transaction records          |

---

### 2.4 API Architecture (Current)

#### Platform Admin Routes
*Protected by `requirePlatformAdmin` (OIDC auth + email allowlist)*

| Method | Endpoint                        | Description                     |
|--------|---------------------------------|---------------------------------|
| GET    | /api/admin/sites                | List all sites                  |
| GET    | /api/admin/sites/enhanced       | List sites with enriched data   |
| GET    | /api/admin/sites/:id            | Get single site details         |
| POST   | /api/admin/sites                | Create new site                 |
| PATCH  | /api/admin/sites/:id            | Update site                     |
| DELETE | /api/admin/sites/:id            | Delete site                     |
| GET    | /api/admin/users                | List all platform users         |
| POST   | /api/admin/users                | Create platform user            |
| DELETE | /api/admin/users/:id            | Delete platform user            |
| POST   | /api/admin/impersonate/:siteId  | Impersonate tenant admin        |
| GET    | /api/admin/revenue              | Revenue dashboard data          |

#### Auth Routes

| Method | Endpoint                  | Description                          |
|--------|---------------------------|--------------------------------------|
| GET    | /api/login                | Initiate Replit OIDC login           |
| GET    | /api/callback             | OIDC callback handler                |
| GET    | /api/logout               | OIDC logout                          |
| GET    | /api/auth/user            | Get current authenticated user       |
| POST   | /api/signup               | New contractor signup                |
| POST   | /api/tenant/auth/login    | Tenant admin email/password login    |
| POST   | /api/tenant/auth/logout   | Tenant admin logout                  |
| GET    | /api/tenant/auth/me       | Get current tenant admin user        |

#### Tenant Admin Routes
*Protected by `requireTenantAdmin` (session-based tenant auth)*

| Method | Endpoint                        | Description                     |
|--------|---------------------------------|---------------------------------|
| GET    | /api/tenant/settings            | Get site settings               |
| PATCH  | /api/tenant/settings            | Update site settings            |
| GET    | /api/tenant/users               | List tenant users               |
| POST   | /api/tenant/users               | Create tenant user              |
| DELETE | /api/tenant/users/:id           | Delete tenant user              |
| GET    | /api/tenant/pages               | List site pages                 |
| PATCH  | /api/tenant/pages/:id           | Update page content             |
| GET    | /api/tenant/leads               | List leads for site             |
| PATCH  | /api/tenant/leads/:id           | Update lead status              |
| POST   | /api/tenant/publish             | Publish site (set live)         |
| POST   | /api/tenant/unpublish           | Unpublish site                  |
| GET    | /api/tenant/appointments        | List appointments [Backend Only] |
| PATCH  | /api/tenant/appointments/:id    | Update appointment status [Backend Only] |

#### Public Site Routes
*Require tenant context (`requireTenant`), no authentication*

| Method | Endpoint                   | Description                          |
|--------|----------------------------|--------------------------------------|
| GET    | /api/site                  | Get public site data                 |
| GET    | /api/site/pages/:slug      | Get page by slug                     |
| POST   | /api/site/leads            | Submit lead/contact form             |
| GET    | /api/site/photos           | Get site photos                      |
| GET    | /api/site/testimonials     | Get testimonials                     |
| GET    | /api/site/pricing          | Get service pricing                  |
| POST   | /api/site/appointments     | Submit appointment request           |
| POST   | /api/site/chat             | Send chatbot message                 |
| POST   | /api/site/chat/lead        | Capture lead from chatbot            |
| GET    | /api/site/chat/history     | Get chatbot conversation history     |

#### Onboarding Routes

| Method | Endpoint                          | Description                      |
|--------|-----------------------------------|----------------------------------|
| POST   | /api/onboarding/chat              | AI onboarding conversation       |
| POST   | /api/onboarding/generate          | Generate site content via AI     |
| POST   | /api/onboarding/photos            | Upload onboarding photos         |
| POST   | /api/onboarding/style             | Set style preferences            |
| POST   | /api/onboarding/pages             | Configure selected pages         |
| GET    | /api/onboarding/progress/:siteId  | Get onboarding progress          |

#### Stripe / Billing Routes

| Method | Endpoint                          | Description                      |
|--------|-----------------------------------|----------------------------------|
| GET    | /api/stripe/publishable-key       | Get Stripe publishable key       |
| GET    | /api/stripe/products              | List subscription products       |
| POST   | /api/stripe/checkout              | Create checkout session          |
| POST   | /api/stripe/portal                | Create billing portal session    |
| GET    | /api/stripe/subscription/:siteId  | Get subscription status          |
| POST   | /api/stripe/webhook               | Stripe webhook endpoint          |

#### Other Routes

| Method | Endpoint              | Description                     |
|--------|-----------------------|---------------------------------|
| POST   | /api/contact-sales    | Contact sales form submission   |

---

### 2.5 Frontend Architecture (Current)

#### Domain-Based App Shells

```
App.tsx
  │
  ├── detectDomainType(hostname)
  │     │
  │     ├── 'main'         ──▶  MainApp
  │     │                        ├── Landing
  │     │                        ├── SignUp
  │     │                        ├── Login
  │     │                        ├── Onboarding
  │     │                        ├── Demo
  │     │                        ├── PreviewSite / PreviewAdmin
  │     │                        └── Admin (sidebar layout)
  │     │                             ├── Dashboard
  │     │                             ├── Sites / SiteDetail
  │     │                             ├── Users
  │     │                             └── Revenue
  │     │
  │     ├── 'tenantAdmin'  ──▶  TenantAdminApp (TenantAdminLayout)
  │     │                        ├── Login
  │     │                        ├── Dashboard
  │     │                        ├── Pages / PageEditor
  │     │                        ├── Leads
  │     │                        ├── Settings
  │     │                        └── TenantUsers
  │     │
  │     └── 'tenantPublic' ──▶  PublicSite (single-page renderer)
  │
  └── Providers: QueryClientProvider, TooltipProvider, Toaster
```

**State Management:**
- TanStack React Query v5 with custom query client (`lib/queryClient.ts`)
- Default fetcher configured with credentials: "include"
- 5-minute stale time, smart retry logic (no retry on 4xx except 408)
- `apiRequest()` helper for mutations (POST/PATCH/DELETE)

**Authentication Hooks:**
- `useAuth()` — Replit Auth status for platform admin (polls `/api/auth/user`)
- `PlatformAdminGuard` — Protects admin routes, redirects unauthenticated users

**UI Framework:**
- Shadcn/ui component library (full suite in `components/ui/`)
- Tailwind CSS with custom theme variables
- lucide-react icons throughout
- Custom components: ChatBot, AppointmentScheduler, QuoteCalculator, BeforeAfterSlider, ServiceAreaMap, ProjectGallery, StylePicker, PhotoUpload, DomainSetup

---

### 2.6 Key Middleware Stack

```
Request
  │
  ▼
  1. POST /api/stripe/webhook ──── express.raw() ──── WebhookHandlers.processWebhook()
  │   (registered BEFORE express.json to preserve raw body for Stripe signature verification)
  │
  ▼
  2. express.json()
  │
  ▼
  3. Request Logging Middleware
  │   (logs method, path, timing)
  │
  ▼
  4. express-session
  │   (PostgreSQL store via connect-pg-simple, 7-day TTL, httpOnly + secure cookies)
  │
  ▼
  5. Passport.js
  │   (Replit Auth OIDC strategy, serialize/deserialize user)
  │   (OIDC routes gated by isTenantDomain() — only available on main domain)
  │
  ▼
  6. tenantMiddleware
  │   (hostname → site lookup: custom domain first, then subdomain extraction)
  │   (attaches req.site, req.tenantId, req.isTenantAdmin)
  │
  ▼
  Route-level middleware:
  │
  ├── requirePlatformAdmin ── OIDC auth check + PLATFORM_ADMIN_EMAILS allowlist
  ├── requireTenantAdmin ──── Session-based: req.session.userId + req.session.siteId
  └── requireTenant ────────── Tenant context required (req.site must exist), no auth
```

---

### 2.7 File Structure

```
localblue/
├── client/
│   ├── index.html
│   ├── public/
│   │   ├── favicon.png, logo.png, logo-wordmark.png
│   │   └── demo/
│   │       ├── onboarding-demo.mp4
│   │       └── step-*.png (onboarding screenshots)
│   └── src/
│       ├── App.tsx                          # Main router, domain detection, admin sidebar
│       ├── main.tsx                         # React entry point
│       ├── index.css                        # Tailwind + custom theme variables
│       ├── assets/images/trades/            # Hero images per trade type
│       ├── components/
│       │   ├── ui/                          # Shadcn component library (40+ components)
│       │   ├── AnimatedSection.tsx          # Scroll animation wrapper
│       │   ├── AppointmentScheduler.tsx     # Public booking widget
│       │   ├── BeforeAfterSlider.tsx        # Project comparison slider
│       │   ├── ChatBot.tsx                  # AI chatbot widget
│       │   ├── DomainSetup.tsx              # Custom domain configuration
│       │   ├── ErrorBoundary.tsx            # React error boundary
│       │   ├── FloatingIcons.tsx            # Decorative animation
│       │   ├── Logo.tsx                     # Brand logo component
│       │   ├── OnboardingProgress.tsx       # Onboarding step indicator
│       │   ├── PageSelector.tsx             # Page selection during onboarding
│       │   ├── PhotoUpload.tsx              # Image upload component
│       │   ├── ProjectGallery.tsx           # Photo gallery display
│       │   ├── PublishButton.tsx            # Site publish toggle
│       │   ├── QuoteCalculator.tsx          # Interactive quote tool
│       │   ├── ServiceAreaMap.tsx           # Service area visualization
│       │   ├── StylePicker.tsx              # Style preference selector
│       │   ├── TenantAdminLayout.tsx        # Tenant admin sidebar layout
│       │   ├── TypewriterText.tsx           # Typewriter animation
│       │   └── VideoModal.tsx               # Video player modal
│       ├── hooks/
│       │   ├── use-auth.ts                  # Replit Auth hook
│       │   ├── use-toast.ts                 # Toast notification hook
│       │   ├── use-mobile.tsx               # Mobile detection hook
│       │   ├── use-scroll-animation.ts      # Scroll-triggered animations
│       │   ├── use-scroll-spy.ts            # Active section detection
│       │   └── use-seo.ts                   # SEO meta tag management
│       ├── lib/
│       │   ├── queryClient.ts               # TanStack Query config + apiRequest
│       │   ├── auth-utils.ts                # Auth helpers, domain detection
│       │   ├── message-utils.tsx            # Chat message formatting
│       │   └── utils.ts                     # General utilities (cn, etc.)
│       └── pages/
│           ├── admin/
│           │   ├── Dashboard.tsx            # Platform admin overview
│           │   ├── Sites.tsx                # Site management list
│           │   ├── SiteDetail.tsx           # Individual site detail
│           │   ├── Users.tsx                # User management
│           │   └── Revenue.tsx              # Revenue analytics
│           ├── tenant-admin/
│           │   ├── Login.tsx                # Tenant admin login
│           │   ├── Dashboard.tsx            # Tenant dashboard
│           │   ├── Settings.tsx             # Site settings editor
│           │   ├── Pages.tsx                # Page management list
│           │   ├── PageEditor.tsx           # WYSIWYG page editor
│           │   ├── Leads.tsx                # Lead management
│           │   └── TenantUsers.tsx          # Tenant user management
│           ├── Landing.tsx                  # Marketing landing page
│           ├── SignUp.tsx                   # Contractor signup flow
│           ├── Login.tsx                    # Platform login
│           ├── Onboarding.tsx              # AI-powered onboarding
│           ├── Demo.tsx                    # Interactive demo page
│           ├── PublicSite.tsx              # Public site renderer
│           ├── PreviewSite.tsx             # Site preview (pre-publish)
│           ├── PreviewAdmin.tsx            # Admin preview mode
│           ├── TenantImpersonate.tsx       # Admin impersonation handler
│           └── not-found.tsx               # 404 page
├── server/
│   ├── index.ts                            # Express setup, Stripe init, middleware chain
│   ├── routes.ts                           # All API route definitions
│   ├── storage.ts                          # IStorage interface + DatabaseStorage impl
│   ├── db.ts                               # Drizzle database connection
│   ├── static.ts                           # Static file serving (production)
│   ├── vite.ts                             # Vite dev server integration
│   ├── cloudflare.ts                       # Cloudflare DNS API for custom domains
│   ├── stripeClient.ts                     # Stripe client + sync initialization
│   ├── stripeRoutes.ts                     # Stripe API routes (checkout, portal, products)
│   ├── webhookHandlers.ts                  # Stripe webhook processing
│   ├── seed.ts                             # Database seed data
│   ├── seed-stripe-products.ts             # Stripe product seeding
│   ├── middleware/
│   │   └── tenantMiddleware.ts             # Tenant detection + auth guards
│   ├── services/
│   │   └── email.ts                        # Resend email service
│   └── replit_integrations/
│       ├── auth/
│       │   ├── index.ts                    # Auth barrel export
│       │   ├── replitAuth.ts               # OIDC setup, session config, isTenantDomain
│       │   ├── routes.ts                   # /api/auth/user route
│       │   └── storage.ts                  # Auth user CRUD (upsert)
│       ├── batch/
│       │   ├── index.ts                    # Batch operations
│       │   └── utils.ts                    # Batch utilities
│       └── chat/
│           ├── index.ts                    # Chat integration
│           ├── routes.ts                   # Chat routes
│           └── storage.ts                  # Chat storage
├── shared/
│   ├── schema.ts                           # Drizzle schema, types, enums, Zod schemas
│   ├── tradeTemplates.ts                   # Trade configs, style templates, page defs
│   └── models/
│       └── auth.ts                         # Auth user/session table definitions
├── docs/
│   ├── NORTH_STAR.md                       # Product north star document
│   ├── PRODUCT_MEMO.md                     # Product strategy memo
│   └── PLATFORM_ARCHITECTURE.md            # This document
├── script/
│   └── build.ts                            # Production build script
├── package.json                            # Dependencies and scripts
├── tsconfig.json                           # TypeScript configuration
├── vite.config.ts                          # Vite build configuration
├── tailwind.config.ts                      # Tailwind CSS configuration
├── drizzle.config.ts                       # Drizzle ORM configuration
├── postcss.config.js                       # PostCSS configuration
├── components.json                         # Shadcn/ui configuration
└── replit.md                               # Project documentation (Replit-specific)
```

---

## 3. Proposed Roadmap Architecture

### Phase 1: Foundation Hardening (Q1-Q2 2026)

| Area           | Initiative                                                                    | Priority |
|----------------|-------------------------------------------------------------------------------|----------|
| **Database**   | Add proper migrations via Drizzle Kit, connection pooling, read replicas       | Critical |
| **Caching**    | Redis/in-memory for session store, API response caching, static asset CDN     | High     |
| **Monitoring** | Structured logging (JSON), error tracking (Sentry), uptime monitoring, APM    | Critical |
| **Testing**    | E2E test suite (Playwright), unit tests (Vitest), CI/CD pipeline              | High     |
| **Security**   | Rate limiting on all API routes, CSRF protection, input sanitization audit, CSP headers | Critical |

```
Phase 1 Target Architecture:
┌──────────────┐     ┌──────────────┐
│  CDN Layer   │────▶│  Express.js  │
│  (Static)    │     │  + Rate      │
└──────────────┘     │    Limiting  │
                     └──────┬───────┘
                            │
                  ┌─────────┼─────────┐
                  │         │         │
            ┌─────▼───┐ ┌──▼──┐ ┌───▼────┐
            │ Redis    │ │ PG  │ │ Sentry │
            │ (Cache + │ │ w/  │ │ (Error │
            │  Session)│ │Pool │ │  Track)│
            └─────────┘ └─────┘ └────────┘
```

### Phase 2: Scale Architecture (Q2-Q3 2026)

| Area                    | Initiative                                                         | Priority |
|-------------------------|--------------------------------------------------------------------|----------|
| **Multi-location**      | Sites can have multiple locations/service areas with per-location pages | High     |
| **Media pipeline**      | Image optimization (Sharp/Cloudinary), upload to object storage, thumbnails | High     |
| **Background jobs**     | Queue system (BullMQ/Redis) for email, AI generation, image processing | High     |
| **API versioning**      | v1 prefix on all routes, backward compatibility strategy            | Medium   |
| **Webhooks outbound**   | Notify contractors of new leads, appointments via configurable webhook | Medium   |

### Phase 3: Platform Expansion (Q3-Q4 2026)

| Area                       | Initiative                                                      | Priority |
|----------------------------|-----------------------------------------------------------------|----------|
| **Plugin/Integrations**    | Marketplace for Google Ads, analytics, CRM integrations         | High     |
| **White-label reseller**   | Multi-level tenant hierarchy (Reseller -> Contractor -> Site)   | Medium   |
| **Mobile app**             | React Native or PWA for lead alerts and basic management        | Medium   |
| **Advanced CRM**           | Lead pipeline, automated follow-up sequences, email marketing   | High     |
| **Reputation management**  | Review collection, response automation, Google Business sync    | Medium   |

### Phase 4: Enterprise Scale (2027+)

| Area                        | Initiative                                                     | Priority |
|-----------------------------|----------------------------------------------------------------|----------|
| **Microservices migration** | Split monolith: Auth, Sites, AI, Media, Billing services       | High     |
| **Event-driven arch**       | Message bus (NATS/Kafka) for inter-service communication       | High     |
| **Multi-region**            | Geographic distribution for latency reduction                  | Medium   |
| **Franchise/multi-unit**    | Hierarchical org structure with roll-up reporting              | Medium   |
| **AI voice assistant**      | Phone-based AI for after-hours call handling                   | Low      |
| **International**           | i18n, multi-currency, multi-language content generation        | Low      |

---

## 4. Infrastructure Diagram (Proposed — Phase 4 Target)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     Production Infrastructure (Target)                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                          ┌─────────────────┐                                   │
│                          │   Cloudflare     │                                   │
│                          │   CDN + DNS      │                                   │
│                          │   + WAF          │                                   │
│                          └────────┬────────┘                                   │
│                                   │                                             │
│                          ┌────────▼────────┐                                   │
│                          │  Load Balancer  │                                   │
│                          └────────┬────────┘                                   │
│                                   │                                             │
│              ┌────────────────────┼────────────────────┐                       │
│              │                    │                    │                        │
│     ┌────────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐              │
│     │  API Server 1   │  │  API Server 2  │  │  API Server N  │              │
│     │  (Express.js)   │  │  (Express.js)  │  │  (Express.js)  │              │
│     └────────┬────────┘  └───────┬────────┘  └───────┬────────┘              │
│              │                    │                    │                        │
│              └────────────────────┼────────────────────┘                       │
│                                   │                                             │
│         ┌─────────────────────────┼─────────────────────────┐                  │
│         │                         │                         │                   │
│  ┌──────▼──────┐          ┌──────▼──────┐          ┌───────▼───────┐          │
│  │   Redis     │          │  Message    │          │  Background   │          │
│  │   Cluster   │          │  Bus        │          │  Workers      │          │
│  │             │          │  (NATS/     │          │               │          │
│  │  - Sessions │          │   Kafka)    │          │  - Email      │          │
│  │  - Cache    │          │             │          │  - AI Gen     │          │
│  │  - Queues   │          │  - Events   │          │  - Image Proc │          │
│  └─────────────┘          │  - Webhooks │          │  - Webhooks   │          │
│                           └─────────────┘          └───────────────┘          │
│                                                                                 │
│         ┌─────────────────────────┼─────────────────────────┐                  │
│         │                         │                         │                   │
│  ┌──────▼──────┐          ┌──────▼──────┐          ┌───────▼───────┐          │
│  │ PostgreSQL  │          │ PostgreSQL  │          │  Object       │          │
│  │ Primary     │          │ Read        │          │  Storage      │          │
│  │             │◀────────▶│ Replicas    │          │  (S3/R2)      │          │
│  │  - App Data │  Repl.   │             │          │               │          │
│  │  - Sessions │          │  - Analytics │          │  - Photos     │          │
│  │  - Stripe   │          │  - Reports   │          │  - Documents  │          │
│  └─────────────┘          └─────────────┘          │  - Thumbnails │          │
│                                                     └───────────────┘          │
│                                                                                 │
│         ┌─────────────────────────────────────────────────┐                    │
│         │              External Services                   │                    │
│         │                                                  │                    │
│         │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │                    │
│         │  │ Anthropic│  │  Stripe  │  │  Resend  │      │                    │
│         │  │ Claude   │  │  Billing │  │  Email   │      │                    │
│         │  └──────────┘  └──────────┘  └──────────┘      │                    │
│         │                                                  │                    │
│         │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │                    │
│         │  │ Twilio   │  │  Google  │  │ Sentry   │      │                    │
│         │  │ (Voice)  │  │  APIs    │  │ (Errors) │      │                    │
│         │  └──────────┘  └──────────┘  └──────────┘      │                    │
│         └─────────────────────────────────────────────────┘                    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Technology Decisions Log

| Decision                      | Date     | Rationale                                                          | Alternatives Considered                    |
|-------------------------------|----------|--------------------------------------------------------------------|--------------------------------------------|
| Express.js                    | Jan 2026 | Lightweight, team familiarity, adequate for MVP monolith           | Fastify, NestJS, Hono                      |
| Drizzle ORM                   | Jan 2026 | Type-safe, lightweight, excellent DX, good Replit integration      | Prisma, Kysely, TypeORM                    |
| PostgreSQL (Neon)              | Jan 2026 | Replit-native, serverless-friendly, strong SQL capabilities        | SQLite, MySQL, Supabase                    |
| React + Vite                  | Jan 2026 | Fast DX, industry standard, large ecosystem                       | Next.js, Remix, SvelteKit                  |
| Wouter                        | Jan 2026 | Lightweight client-side routing, smaller bundle than React Router  | React Router, TanStack Router              |
| TanStack React Query v5       | Jan 2026 | Powerful data fetching, caching, devtools, mutation management     | SWR, RTK Query                             |
| Shadcn/ui + Tailwind CSS      | Jan 2026 | Flexible, accessible, composable, copy-paste ownership             | Material UI, Chakra UI, Radix primitives   |
| Anthropic Claude Opus 4.5     | Jan 2026 | Best quality for conversational AI, trade-specific knowledge       | OpenAI GPT-4, Google Gemini                |
| Stripe via Replit sync         | Feb 2026 | Auto-sync to PostgreSQL, managed webhook, reduced boilerplate      | Manual Stripe integration, Paddle, Lemon Squeezy |
| Replit Auth (OIDC/Passport)    | Feb 2026 | Platform admin auth, automatic secret management, zero-config      | Auth0, Clerk, custom JWT                   |
| bcrypt + express-session       | Feb 2026 | Tenant auth: simple, proven, no external dependency                | JWT tokens, Passport local strategy        |
| PostgreSQL session store       | Feb 2026 | Shared across auth systems, persistent, no additional infra        | Redis sessions, in-memory store            |
| Resend                        | Feb 2026 | Simple API, good deliverability, developer-friendly                | SendGrid, Mailgun, AWS SES                 |
| Cloudflare DNS API             | Feb 2026 | Custom domain automation, industry-standard DNS provider           | Route53, manual DNS setup                  |
| lucide-react                  | Jan 2026 | Consistent icon set, tree-shakeable, Shadcn default                | Heroicons, Phosphor, react-icons           |

---

## 6. Appendix

### A. Environment Variables

| Variable                               | Purpose                                  | Source             |
|----------------------------------------|------------------------------------------|--------------------|
| `DATABASE_URL`                         | PostgreSQL connection string             | Replit (auto)      |
| `SESSION_SECRET`                       | Express session encryption key           | Replit secret      |
| `ISSUER_URL`                           | OIDC issuer for Replit Auth              | Replit (auto)      |
| `REPL_ID`                              | Replit application identifier            | Replit (auto)      |
| `REPLIT_DOMAINS`                       | Comma-separated list of app domains      | Replit (auto)      |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY`    | Anthropic API key                        | Replit integration |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`   | Anthropic API base URL                   | Replit integration |
| `RESEND_API_KEY`                       | Resend email service API key             | Replit secret      |
| `PLATFORM_ADMIN_EMAILS`               | Comma-separated admin email allowlist    | Replit env var     |
| `CLOUDFLARE_API_TOKEN`                 | Cloudflare DNS management token          | Replit secret      |
| `CLOUDFLARE_ZONE_ID`                   | Cloudflare zone for localblue.co         | Replit env var     |
| `REPLIT_CONNECTORS_HOSTNAME`           | Stripe connector hostname                | Replit (auto)      |

### B. Key Enums

```typescript
TRADE_TYPES = ["general_contractor", "plumber", "electrician", "roofer", "hvac", "painter", "landscaper"]

STYLE_PREFERENCES = ["professional", "bold", "warm", "luxury"]

SUBSCRIPTION_PLANS = ["starter", "growth", "scale"]

TRIAL_PHASES = ["test_drive", "professional_launch", "active", "expired"]

ONBOARDING_PHASES = ["welcome", "business_basics", "trade_detection", "services", "story",
                      "differentiators", "service_area", "style", "pages", "photos", "review", "complete"]
```

### C. Data Flow: New Contractor Signup

```
1. Contractor visits localblue.co/signup
2. Fills signup form (email, password, business name)
3. POST /api/signup
   ├── Hash password (bcrypt, 10 rounds)
   ├── Generate unique subdomain from business name
   ├── Create site record (trial_phase: test_drive)
   ├── Create tenant_user record linked to site
   ├── Create onboarding_progress record
   └── Send welcome email via Resend
4. Redirect to /onboarding/:siteId
5. AI-driven onboarding conversation (Claude Opus 4.5)
   ├── Collects: trade type, services, story, service area, style
   ├── Generates: page content, tagline, about content
   └── Saves progress to onboarding_progress table
6. Site preview available at PreviewSite
7. Contractor publishes → isPublished = true
8. Site live at {subdomain}.localblue.co
9. Optional: Custom domain setup via Cloudflare DNS
```

---

*This document is maintained by the LocalBlue engineering team and should be updated whenever significant architectural changes are made.*
