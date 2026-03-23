# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LocalBlue is a multi-tenant SaaS website builder for local contractors (roofers, electricians, plumbers, HVAC, etc.). Contractors manage their sites via `admin.{their-domain}`. The platform has three access levels: platform admin, tenant admin (contractor), and public site visitor.

## Commands

```bash
npm run dev          # Start dev server (Express + Vite HMR) on port 5000
npm run build        # Production build (Vite client → dist/public/, esbuild server → dist/index.cjs)
npm start            # Run production build
npm run check        # TypeScript type checking (tsc)
npm run db:push      # Push schema changes to PostgreSQL via drizzle-kit
npm run seed-demo    # Seed a demo roofing company for testing
```

There is no test runner configured in this project.

## Architecture

### Monorepo Structure (single package.json)

- **`client/`** — React 18 SPA (Vite, Wouter router, TanStack Query, Tailwind + shadcn/ui)
- **`server/`** — Express v5 API (TypeScript, Drizzle ORM, PostgreSQL)
- **`shared/`** — Database schema (Drizzle tables), Zod validation schemas, and inferred TypeScript types shared by both client and server

### Multi-Tenancy

Tenant resolution is hostname-based via `server/middleware/tenantMiddleware.ts`. The middleware parses the incoming hostname to detect:
- Subdomain match (e.g., `mysite.localhost:5000`)
- Custom domain match
- Admin prefix (e.g., `admin.mysite.localhost` routes to tenant admin panel)

The resolved `site` and `tenantId` are set on `req` for downstream route handlers.

### Authentication

Two separate auth systems, both using express-session backed by PostgreSQL (connect-pg-simple):
- **Platform admin**: validated against `PLATFORM_ADMIN_EMAILS` env var, stored in `req.session.platformAdmin`. Protected by `requirePlatformAdmin` middleware.
- **Tenant admin**: email/password with bcrypt, stored in `tenantUsers` table. Protected by `requireTenantAuth` and `requireTenantRole(roles)` middleware. Roles: `owner`, `admin`, `editor`, `viewer`.

### Data Layer

- **Schema definition**: `shared/schema.ts` — all Drizzle table definitions, Zod insert schemas, and exported TypeScript types
- **Storage abstraction**: `server/storage.ts` — `DatabaseStorage` class implements `IStorage` interface; all DB access goes through this layer
- **Type pattern**: Tables define `Site`, insert schemas define `InsertSite`, all inferred from Drizzle/Zod

### Frontend Patterns

- **Routing**: Wouter with path-based routes in `client/src/App.tsx`
- **API calls**: TanStack React Query with 5-minute stale time; mutations use `apiRequest()` helper from `client/src/lib/queryClient.ts`
- **All fetch calls use `credentials: "include"`** for cookie-based session auth
- **Path aliases**: `@/*` → `client/src/`, `@shared/*` → `shared/`

### Key Server Files

- `server/routes.ts` — Main API routes (~3200 lines, contains most tenant and public endpoints)
- `server/routes/admin.ts` — Platform admin API routes
- `server/routes/integration.ts` — FB-Brain webhook routes (RFQ/bidding)
- `server/stripeRoutes.ts` — Stripe checkout/webhook routes
- `server/cloudflare.ts` — Custom domain DNS/SSL management via Cloudflare API

### External Services

- **Stripe** — Subscription billing and checkout
- **Resend** — Email notifications to contractors on new leads
- **Anthropic Claude** — AI onboarding content generation
- **Cloudflare** — Custom domain DNS records and SSL certificates
- **FB-Brain** — External RFQ (Request for Quote) integration via webhooks

### Database

PostgreSQL with Drizzle ORM. Schema changes go in `shared/schema.ts`, then apply with `npm run db:push`. Migrations output to `migrations/` directory. Key tables: `sites`, `tenantUsers`, `leads`, `sitePhotos`, `rfqs`, `bids`, `servicePricing`, `testimonials`, `analyticsEvents`, `analyticsDaily`.

## Environment Variables

Required: `DATABASE_URL`, `SESSION_SECRET`, `PLATFORM_ADMIN_EMAILS`, `PLATFORM_ADMIN_PASSWORD`

Optional integrations: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_CNAME_TARGET`, `AI_INTEGRATIONS_ANTHROPIC_API_KEY`, `FB_BRAIN_URL`, `INTEGRATION_API_KEY`
