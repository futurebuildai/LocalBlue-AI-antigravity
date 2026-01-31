# LocalBlue.ai Platform

## Overview
LocalBlue.ai is an AI-powered website builder platform specifically designed for **local general contractors and trade contractors** (mostly residential). Unlike Wix, GoDaddy, and other AI web builders where everything is managed through their platform, LocalBlue.ai enables contractors to manage everything from their own custom domain once their site is built.

**Key Differentiator**: Once the site is built, contractors don't need to return to LocalBlue.ai - they manage everything from their own custom AI site domain (e.g., `admin.smithplumbing.com`).

Built with Express.js and React, supporting:
- **Platform Admin**: LocalBlue.ai team manages all tenants globally
- **Tenant Admin**: Each contractor has their own admin panel at `admin.{subdomain}` or `admin.{customdomain}`

## Architecture

### Backend (Express.js)
- **Port**: 5000 (serves both API and frontend)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: 
  - bcrypt for password hashing
  - express-session for tenant admin sessions

### Frontend (React + Vite)
- **UI Library**: Shadcn/ui components
- **State Management**: TanStack React Query
- **Routing**: Wouter
- **Styling**: Tailwind CSS

## Data Models

### User
- `id` (UUID, auto-generated)
- `email` (unique)
- `password` (hashed with bcrypt)
- `siteId` (foreign key to Site)

### Site
- `id` (UUID, auto-generated)
- `subdomain` (unique)
- `customDomain` (optional)
- `businessName`
- `brandColor` (hex color)
- `services` (JSON array)
- `isPublished` (boolean)

## Multi-Tenant Middleware

The tenant middleware (`server/middleware/tenantMiddleware.ts`) intercepts all requests and:
1. Detects admin subdomain pattern (`admin.{subdomain}` or `admin.{customDomain}`)
2. Checks if hostname matches any Site's `customDomain`
3. Extracts subdomain from hostname and looks up the Site
4. Attaches `req.site`, `req.tenantId`, and `req.isTenantAdmin` to the request

### Admin Subdomain Detection
- `admin.acme.example.com` → Tenant admin for ACME (subdomain pattern)
- `admin.mysite.com` → Tenant admin if `mysite.com` is a custom domain
- Platform admin routes (`/api/admin/*`) bypass tenant detection

## API Routes

### Platform Admin Routes (no tenant context)
- `GET /api/admin/sites` - List all sites
- `GET /api/admin/sites/:id` - Get site by ID
- `POST /api/admin/sites` - Create site
- `PATCH /api/admin/sites/:id` - Update site
- `DELETE /api/admin/sites/:id` - Delete site
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get user by ID
- `POST /api/admin/users` - Create user
- `PATCH /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

### Tenant Admin Routes (require admin subdomain + auth)
- `POST /api/tenant/auth/login` - Login tenant user
- `POST /api/tenant/auth/logout` - Logout tenant user
- `GET /api/tenant/auth/me` - Get current logged-in user
- `GET /api/tenant/settings` - Get tenant's site settings
- `PATCH /api/tenant/settings` - Update tenant's site settings
- `GET /api/tenant/users` - List users for this tenant
- `POST /api/tenant/users` - Create user for this tenant

### Public Tenant Routes
- `GET /api/site` - Get current tenant's site info (requires published site)
- `GET /api/tenant` - Check tenant detection status

## Key Files

- `shared/schema.ts` - Database models and TypeScript types
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage layer with CRUD operations
- `server/routes.ts` - All API routes
- `server/middleware/tenantMiddleware.ts` - Hostname-based tenant detection + admin subdomain
- `server/seed.ts` - Database seeding with sample data
- `client/src/App.tsx` - Main React app with dual-mode routing (platform/tenant admin)
- `client/src/pages/admin/` - Platform admin dashboard pages
- `client/src/pages/tenant-admin/` - Tenant admin pages (Login, Dashboard, Settings, Users)
- `client/src/components/TenantAdminLayout.tsx` - Tenant admin layout with sidebar

## Development

The application seeds the database with sample data on startup:
- 3 sample sites (ACME, Bloom Wellness, TechPro)
- 4 sample users assigned to sites (password: "password123")

## Security

- All tenant admin API routes require admin subdomain access (`requireTenantAdmin`)
- Protected routes also require session authentication (`requireTenantAuth`)
- Session validates that user belongs to the current tenant (siteId match)
- SESSION_SECRET required in production (fails immediately if missing)

## Recent Changes
- 2026-01-31: Added tenant-specific admin portal at `admin.{subdomain}` with login, dashboard, settings, and user management
- 2026-01-30: Initial implementation of multi-tenant structure with User and Site models, hostname-based middleware, and platform admin dashboard
