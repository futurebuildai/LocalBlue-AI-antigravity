# Multi-Tenant Web Application

## Overview
A multi-tenant web application with hostname-based routing, built with Express.js and React. The system supports multiple tenant sites, each identified by subdomain or custom domain.

## Architecture

### Backend (Express.js)
- **Port**: 5000 (serves both API and frontend)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: bcrypt for password hashing

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
1. First checks if the hostname matches any Site's `customDomain`
2. If not, extracts the subdomain from the hostname and looks up the Site
3. Attaches the Site to `req.site` and `req.tenantId`

Routes under `/api/admin/*` bypass tenant detection for admin operations.

## API Routes

### Admin Routes (no tenant context)
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

### Tenant-Scoped Routes
- `GET /api/site` - Get current tenant's site info (requires tenant context)
- `GET /api/tenant` - Check tenant detection status

## Key Files

- `shared/schema.ts` - Database models and TypeScript types
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage layer with CRUD operations
- `server/routes.ts` - API routes
- `server/middleware/tenantMiddleware.ts` - Hostname-based tenant detection
- `server/seed.ts` - Database seeding with sample data
- `client/src/App.tsx` - Main React app with sidebar navigation
- `client/src/pages/admin/` - Admin dashboard pages

## Development

The application seeds the database with sample data on startup:
- 3 sample sites (ACME, Bloom Wellness, TechPro)
- 4 sample users assigned to sites

## Recent Changes
- 2026-01-30: Initial implementation of multi-tenant structure with User and Site models, hostname-based middleware, and admin dashboard
