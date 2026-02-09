# LocalBlue — User Access & Permissions

> Last updated: February 9, 2026

---

## 1. Overview

LocalBlue operates a **multi-tenant access model** with three distinct levels of access:

| Level | Who | Purpose |
|-------|-----|---------|
| **Platform** | LocalBlue team (founders, admins) | Manage all tenant sites, users, revenue, and platform operations |
| **Tenant** | Individual contractor businesses | Manage their own website, leads, pages, settings, and team members |
| **Public** | Website visitors / homeowners | Browse contractor websites, submit inquiries, book appointments |

Each level has its own authentication mechanism, session management, and permission boundaries. Tenant data is fully isolated by `siteId`, and platform admins can cross tenant boundaries for support and management purposes.

---

## 2. User Types & Roles — Current

### 2.1 Platform Admin (LocalBlue Team)

| Attribute | Detail |
|-----------|--------|
| **Auth method** | Replit Auth (OpenID Connect) — users log in via `/api/login` OIDC flow |
| **Storage** | `users` table (`id`, `email`, `firstName`, `lastName`, `profileImageUrl`, `createdAt`, `updatedAt`) |
| **Authorization** | Email must be in `PLATFORM_ADMIN_EMAILS` environment variable (comma-separated list) |
| **Middleware** | `requirePlatformAdmin` in `tenantMiddleware.ts` — checks OIDC auth + email allowlist |
| **Frontend guard** | `PlatformAdminGuard` component — checks auth status AND calls `/api/admin/sites` to verify admin authorization |
| **Domain restriction** | OIDC routes only available on main domain (`localblue.co`, `*.replit.dev`), blocked on tenant domains via `isTenantDomain()` |
| **Current permissions** | Full CRUD on all sites and users, view revenue, impersonate tenant admins |

### 2.2 Tenant Admin (Contractor)

| Attribute | Detail |
|-----------|--------|
| **Auth method** | Email/password (bcrypt hashing) via `POST /api/tenant/auth/login` |
| **Storage** | `tenant_users` table (`id`, `email`, `password`, `siteId`) |
| **Session** | express-session with `userId` + `siteId` stored in session |
| **Middleware** | `requireTenantAuth` (checks `session.userId` exists) and `requireTenantAdmin` (loads site context) |
| **Domain** | Accessed via `admin.{subdomain}` or `admin.{customDomain}` |
| **Current permissions** | Manage their own site settings, pages, leads, team users, publish/unpublish, view appointments |

### 2.3 Visitor (Homeowner / Public)

| Attribute | Detail |
|-----------|--------|
| **Auth method** | None (unauthenticated) |
| **Access** | Public contractor websites only |
| **Current permissions** | View public site content, submit contact forms, use AI chatbot, use quote calculator, schedule appointments |

### 2.4 Impersonated Admin

| Attribute | Detail |
|-----------|--------|
| **How** | Platform admin calls `POST /api/admin/impersonate/:siteId` |
| **Session** | Sets `session.userId`, `session.siteId`, `session.isImpersonating = true`, `session.impersonatedBy` |
| **Behavior** | Platform admin gets full tenant admin access for troubleshooting |
| **Access** | Same permissions as tenant admin for the specified site |

---

## 3. Permission Matrix — Current

| Action | Platform Admin | Tenant Admin (Owner) | Tenant Admin (Team) | Visitor |
|--------|:-:|:-:|:-:|:-:|
| **Platform Management** | | | | |
| View all sites | Yes | No | No | No |
| Create/delete sites | Yes | No | No | No |
| Manage platform users | Yes | No | No | No |
| View revenue dashboard | Yes | No | No | No |
| Impersonate tenant admin | Yes | No | No | No |
| **Site Management** | | | | |
| View own site dashboard | Yes (any) | Yes | Yes | No |
| Edit site settings | Yes (any) | Yes | No* | No |
| Edit pages | Yes (any) | Yes | No* | No |
| Publish/unpublish site | Yes (any) | Yes | No | No |
| Connect custom domain | Yes (any) | Yes | No | No |
| **Lead Management** | | | | |
| View leads | Yes (any) | Yes | Yes | No |
| Update lead status | Yes (any) | Yes | Yes | No |
| **User Management** | | | | |
| Add team members | Yes (any) | Yes | No | No |
| Remove team members | Yes (any) | Yes | No | No |
| **Public Site** | | | | |
| View public site | Yes | Yes | Yes | Yes |
| Submit contact form | N/A | N/A | N/A | Yes |
| Use AI chatbot | N/A | N/A | N/A | Yes |
| Use quote calculator | N/A | N/A | N/A | Yes |
| Schedule appointment | N/A | N/A | N/A | Yes |

> *Currently all `tenant_users` have the same permissions. Team vs Owner role differentiation is proposed for a future release (see Section 5).*

---

## 4. Authentication Flow Details

### 4.1 Platform Admin Auth Flow (Replit Auth OIDC)

```
User                    Browser                  Server                   Replit OIDC
 |                        |                        |                        |
 |-- clicks "Sign In" --->|                        |                        |
 |                        |-- GET /api/login ------>|                        |
 |                        |                        |-- isTenantDomain()     |
 |                        |                        |   check (must fail)    |
 |                        |                        |                        |
 |                        |                        |-- Passport.authenticate|
 |                        |<-- 302 redirect -------|   (OIDC strategy)      |
 |                        |                        |                        |
 |                        |-- redirect to Replit -->|                        |
 |                        |                        |                        |
 |<-- user authenticates ---------------------------------->|               |
 |                        |                        |                        |
 |                        |<-- callback to /api/callback ---|               |
 |                        |                        |                        |
 |                        |                        |-- upsertUser() ------->|
 |                        |                        |   (users table)        |
 |                        |                        |                        |
 |                        |                        |-- session created       |
 |                        |<-- 302 to /admin ------|   (passport user obj)  |
 |                        |                        |                        |
 |                        |-- useAuth() polls ---->|                        |
 |                        |   GET /api/auth/user   |                        |
 |                        |                        |                        |
 |                        |-- PlatformAdminGuard ->|                        |
 |                        |   GET /api/admin/sites |                        |
 |                        |   (verifies admin)     |                        |
```

**Step-by-step:**

1. User visits `localblue.co`, clicks "Sign In"
2. Browser navigates to `/api/login`
3. `isTenantDomain()` check — if tenant domain, returns 404
4. Passport.js authenticates with Replit OIDC strategy
5. Redirect to Replit login page — user authenticates
6. Callback to `/api/callback` — Passport creates session
7. User data stored/updated in `users` table via `authStorage.upsertUser()`
8. Session stores passport user object (includes `claims.sub`, email, tokens)
9. Frontend `useAuth()` hook polls `/api/auth/user` to check auth status
10. `PlatformAdminGuard` verifies auth + admin authorization before showing admin UI

### 4.2 Tenant Admin Auth Flow (Email/Password)

```
Contractor              Browser                  Server                   Database
 |                        |                        |                        |
 |-- navigates to ------->|                        |                        |
 |   admin.business.com   |                        |                        |
 |                        |-- detects tenant       |                        |
 |                        |   domain, renders      |                        |
 |                        |   TenantAdminApp       |                        |
 |                        |                        |                        |
 |-- enters credentials ->|                        |                        |
 |                        |-- POST /api/tenant/ -->|                        |
 |                        |   auth/login           |                        |
 |                        |                        |-- lookup tenant_users  |
 |                        |                        |   by email ----------->|
 |                        |                        |<-- user record --------|
 |                        |                        |                        |
 |                        |                        |-- bcrypt.compare()     |
 |                        |                        |                        |
 |                        |                        |-- session.userId = id  |
 |                        |                        |-- session.siteId = sid |
 |                        |<-- 200 OK + user ------|                        |
 |                        |                        |                        |
 |                        |-- GET /api/tenant/ --->|                        |
 |                        |   auth/me              |                        |
 |                        |<-- user + site data ---|                        |
```

**Step-by-step:**

1. Contractor navigates to `admin.theirbusiness.com`
2. Frontend detects tenant domain, renders `TenantAdminApp`
3. Clicks login, submits email/password to `POST /api/tenant/auth/login`
4. Server looks up `tenant_users` by email, verifies bcrypt password
5. Session sets `userId` and `siteId`
6. Frontend queries `GET /api/tenant/auth/me` to check auth status
7. All subsequent API calls use session cookie for auth

### 4.3 Session Isolation

Both auth systems use the **same** PostgreSQL session store (`sessions` table via `connect-pg-simple`), but session conflicts are prevented through field separation:

| Auth System | Session Fields | Domain Scope |
|-------------|---------------|-------------|
| Replit Auth (Platform) | `req.user` via Passport (passport fields in session) | `localblue.co`, `*.replit.dev` |
| Tenant Auth | `req.session.userId` + `req.session.siteId` | `admin.{subdomain}`, `admin.{customDomain}` |

- Cookie domain defaults to current hostname, providing natural isolation between main and tenant domains.
- No cross-domain cookie sharing occurs.

---

## 5. Proposed Role System — Future

### 5.1 Platform Roles

| Role | Description | Access Level |
|------|-------------|-------------|
| Super Admin | LocalBlue founders/CTO | Full platform access, can manage other admins |
| Platform Admin | LocalBlue team members | View/manage all sites, impersonate, view revenue |
| Support Agent | Customer support team | View sites, view leads, impersonate (read-only), no revenue |
| Sales Rep | Sales team | View sites, create demo sites, no admin management |

### 5.2 Tenant Roles (Per-Site)

| Role | Description | Access Level |
|------|-------------|-------------|
| Owner | Business owner who created the site | Full site access, billing, user management, can delete site |
| Admin | Trusted team member | Edit pages, view/manage leads, settings (no billing, no delete) |
| Editor | Content manager | Edit pages only, view leads (read-only) |
| Viewer | Read-only team member | View dashboard, view leads (read-only), no editing |

### 5.3 Seat Limits by Plan

| Plan | Included Seats | Additional Seats |
|------|:-:|:-:|
| Starter | 1 (Owner only) | Not available |
| Growth | 3 (Owner + 2 team) | $10/seat/month |
| Scale | Unlimited | Included |

---

## 6. Tiered Organization Permissions — Proposed

### 6.1 Organization Hierarchy

```
LocalBlue Platform (Super Admin)
|
+-- Platform Admin Team
|   +-- Platform Admin
|   +-- Support Agent
|   +-- Sales Rep
|
+-- Tenant Organizations
    +-- Organization A (e.g., Smith Plumbing)
    |   +-- Owner (Mike Smith)
    |   +-- Admin (Office Manager)
    |   +-- Editor (Marketing person)
    |   +-- Viewer (Technician)
    |
    +-- Organization B (e.g., Johnson Electric)
        +-- Owner
        +-- Admin
```

### 6.2 Multi-Location Organizations (Scale Plan)

```
Enterprise Organization
|
+-- Parent Company Settings
|   +-- Shared Branding (logo, colors)
|   +-- Shared Services List
|   +-- Centralized Billing
|
+-- Location 1: Downtown Office
|   +-- Location Admin
|   +-- Location-specific pages
|   +-- Location-specific leads
|
+-- Location 2: Suburban Branch
|   +-- Location Admin
|   +-- ...
|
+-- Roll-up Reporting
    +-- Combined lead metrics
    +-- Revenue per location
    +-- Performance comparison
```

### 6.3 Reseller/Agency Tier (Future)

```
Reseller (Agency)
|
+-- Reseller Admin Dashboard
|   +-- Manage all client sites
|   +-- White-label the white-label (custom branding)
|   +-- Revenue share tracking
|   +-- Client billing management
|
+-- Client Organization A
|   +-- Owner
|   +-- Team
|
+-- Client Organization B
    +-- Owner
    +-- Team
```

### 6.4 Permission Inheritance

- **Platform overrides tenant**: Platform permissions override all tenant permissions.
- **Owner overrides team**: Owner permissions override all team member permissions.
- **Additive within level**: Role permissions are additive within the same level.
- **Location scoping**: Location permissions are scoped to that location only.
- **Policy inheritance**: Parent organization can set policies that child locations inherit.

---

## 7. Data Isolation & Security

### 7.1 Current Data Isolation

| Mechanism | Description |
|-----------|-------------|
| `siteId` foreign key | All tenant data (pages, leads, appointments, photos, testimonials) is isolated by `siteId` |
| Tenant session validation | `requireTenantAuth` verifies `session.siteId` matches the current site context |
| Platform admin bypass | Platform admins can access any site's data via `/api/admin/*` routes |
| Public route scoping | Public API routes require tenant context via hostname detection but no authentication |
| Domain-restricted OIDC | OIDC routes (`/api/login`, `/api/callback`, `/api/logout`) are blocked on tenant domains via `isTenantDomain()` |

### 7.2 Proposed Security Enhancements

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Row-level security | High | PostgreSQL RLS policies to enforce data isolation at the database level |
| API rate limiting | High | Per-user/role rate limiting to prevent abuse |
| Audit logging | High | Log sensitive actions: settings changes, user management, impersonation |
| Two-factor authentication | Medium | 2FA for platform admin accounts |
| IP allowlisting | Medium | Restrict platform admin access to known IP ranges |
| Session timeout policies | Medium | Configurable per role (e.g., shorter timeout for impersonated sessions) |
| CSRF token validation | High | CSRF protection on all mutation endpoints |

---

## 8. API Route Access Control Reference

### 8.1 Authentication & OIDC Routes

| Route | Method | Required Auth | Required Role | Notes |
|-------|--------|--------------|---------------|-------|
| `/api/login` | GET | None | None | Initiates OIDC flow, main domain only |
| `/api/callback` | GET | None | None | OIDC callback, main domain only |
| `/api/logout` | GET | Replit Auth | None | OIDC logout, main domain only |
| `/api/auth/user` | GET | Replit Auth | None | Returns current user |

### 8.2 Platform Admin Routes

| Route | Method | Required Auth | Required Role | Notes |
|-------|--------|--------------|---------------|-------|
| `/api/admin/sites` | GET | Replit Auth | Platform Admin | List all sites |
| `/api/admin/sites/:id` | GET | Replit Auth | Platform Admin | Site details |
| `/api/admin/sites` | POST | Replit Auth | Platform Admin | Create site |
| `/api/admin/sites/:id` | PATCH | Replit Auth | Platform Admin | Update site |
| `/api/admin/sites/:id` | DELETE | Replit Auth | Platform Admin | Delete site |
| `/api/admin/users` | GET | Replit Auth | Platform Admin | List users |
| `/api/admin/users` | POST | Replit Auth | Platform Admin | Create user |
| `/api/admin/users/:id` | DELETE | Replit Auth | Platform Admin | Delete user |
| `/api/admin/impersonate/:siteId` | POST | Replit Auth | Platform Admin | Impersonate tenant |
| `/api/admin/revenue` | GET | Replit Auth | Platform Admin | Revenue data |

### 8.3 Public & Signup Routes

| Route | Method | Required Auth | Required Role | Notes |
|-------|--------|--------------|---------------|-------|
| `/api/signup` | POST | None | None | Public signup |
| `/api/contact-sales` | POST | None | None | Sales inquiry |

### 8.4 Tenant Auth Routes

| Route | Method | Required Auth | Required Role | Notes |
|-------|--------|--------------|---------------|-------|
| `/api/tenant/auth/login` | POST | None | None | Tenant login |
| `/api/tenant/auth/logout` | POST | Tenant Session | Tenant Admin | Tenant logout |
| `/api/tenant/auth/me` | GET | Tenant Session | Tenant Admin | Current tenant user |

### 8.5 Tenant Management Routes

| Route | Method | Required Auth | Required Role | Notes |
|-------|--------|--------------|---------------|-------|
| `/api/tenant/settings` | GET | Tenant Session | Tenant Admin | Site settings |
| `/api/tenant/settings` | PATCH | Tenant Session | Tenant Admin | Update settings |
| `/api/tenant/users` | GET | Tenant Session | Tenant Admin | List team users |
| `/api/tenant/users` | POST | Tenant Session | Tenant Admin | Add team user |
| `/api/tenant/users/:id` | DELETE | Tenant Session | Tenant Admin | Remove team user |
| `/api/tenant/pages` | GET | Tenant Session | Tenant Admin | List pages |
| `/api/tenant/pages/:id` | PATCH | Tenant Session | Tenant Admin | Edit page |
| `/api/tenant/leads` | GET | Tenant Session | Tenant Admin | List leads |
| `/api/tenant/leads/:id` | PATCH | Tenant Session | Tenant Admin | Update lead |
| `/api/tenant/publish` | POST | Tenant Session | Tenant Admin | Publish site |
| `/api/tenant/unpublish` | POST | Tenant Session | Tenant Admin | Unpublish site |
| `/api/tenant/appointments` | GET | Tenant Session | Tenant Admin | List appointments |
| `/api/tenant/appointments/:id` | PATCH | Tenant Session | Tenant Admin | Update appointment |

### 8.6 Public Site Routes (Tenant Context Required)

| Route | Method | Required Auth | Required Role | Notes |
|-------|--------|--------------|---------------|-------|
| `/api/site` | GET | None | Tenant Context | Public site info |
| `/api/site/pages/:slug` | GET | None | Tenant Context | Page content |
| `/api/site/leads` | POST | None | Tenant Context | Submit lead |
| `/api/site/photos` | GET | None | Tenant Context | Site photos |
| `/api/site/testimonials` | GET | None | Tenant Context | Testimonials |
| `/api/site/pricing` | GET | None | Tenant Context | Service pricing |
| `/api/site/appointments` | POST | None | Tenant Context | Book appointment |
| `/api/site/chat` | POST | None | Tenant Context | AI chatbot message |
| `/api/site/chat/lead` | POST | None | Tenant Context | Chatbot lead capture |
| `/api/site/chat/history` | GET | None | Tenant Context | Chat history |

### 8.7 Other Routes

| Route | Method | Required Auth | Required Role | Notes |
|-------|--------|--------------|---------------|-------|
| `/api/onboarding/*` | Various | Tenant Session | Tenant Admin | Onboarding flow |
| `/api/stripe/*` | Various | Mixed | Mixed | Payment routes |

---

## 9. Implementation Roadmap for Role System

### Phase 1 — Near-term

| Task | Description |
|------|-------------|
| Add `role` column to `tenant_users` | New column with enum values: `owner`, `admin`, `editor`, `viewer`. Default to `owner` for existing users. |
| Update `requireTenantAdmin` middleware | Accept a `requiredRole` parameter. Check the user's role against the required permission level. |
| Create permission helper | Utility function `hasPermission(userRole, requiredRole)` that respects the role hierarchy: `owner > admin > editor > viewer`. |
| Update frontend guards | Show/hide UI elements (settings, user management, publish button) based on the user's role returned from `/api/tenant/auth/me`. |
| Migration script | Backfill all existing `tenant_users` with `role = 'owner'`. |

### Phase 2 — Medium-term

| Task | Description |
|------|-------------|
| Add `platform_roles` table | New table: `id`, `userId`, `role` (super_admin, platform_admin, support_agent, sales_rep). Replace `PLATFORM_ADMIN_EMAILS` env var. |
| Seat limits enforcement | Check seat count against plan limits on `POST /api/tenant/users`. Return `403` with upgrade prompt if limit exceeded. |
| Audit logging table | New `audit_logs` table: `id`, `userId`, `action`, `resourceType`, `resourceId`, `metadata`, `createdAt`. Log impersonation, user management, settings changes, publish/unpublish. |
| Role management UI | Tenant admin UI to assign roles to team members. Platform admin UI to manage platform roles. |

### Phase 3 — Long-term

| Task | Description |
|------|-------------|
| Multi-location organization structure | New `organizations` table linking multiple sites. Parent org settings inherited by child locations. Roll-up reporting across locations. |
| Reseller/agency hierarchy | New `resellers` table with white-label branding. Revenue share tracking. Client billing management dashboard. |
| Row-level security | PostgreSQL RLS policies on all tenant-scoped tables. Enforce `siteId` filtering at the database level. |
| SSO for enterprise tenants | SAML/OIDC integration for enterprise tenant organizations. Allow tenants to use their own identity provider. |

---

## Appendix: Key Source Files

| File | Purpose |
|------|---------|
| `server/middleware/tenantMiddleware.ts` | `requireTenant`, `requireTenantAuth`, `requireTenantAdmin`, `requirePlatformAdmin` middleware |
| `server/replit_integrations/auth/replitAuth.ts` | Replit OIDC setup, `isTenantDomain()`, `setupAuth()`, `isAuthenticated` |
| `server/replit_integrations/auth/storage.ts` | `authStorage.upsertUser()`, `authStorage.getUser()` |
| `server/replit_integrations/auth/routes.ts` | `/api/auth/user` route |
| `server/routes.ts` | All API route definitions and handler logic |
| `shared/schema.ts` | Database schema (`sites`, `tenant_users`, `leads`, etc.) |
| `shared/models/auth.ts` | `users` table, `sessions` table schema |
| `client/src/App.tsx` | `PlatformAdminGuard` component, admin routing |
| `client/src/hooks/use-auth.ts` | `useAuth()` hook for Replit Auth status |
| `client/src/components/TenantAdminLayout.tsx` | Tenant admin sidebar and layout |
