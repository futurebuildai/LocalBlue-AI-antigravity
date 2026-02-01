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

## User Flow

1. **Sign Up**: Contractor visits LocalBlue.ai, enters email, password, business name
2. **AI Onboarding**: Chat with Claude Opus 4.5 to describe their business, services, service area
3. **Site Generation**: AI extracts business details and creates website pages
4. **Preview & Publish**: Review site in tenant admin, connect custom domain, single-click publish
5. **Ongoing Management**: Edit pages, view leads, manage users - all from their own domain

## Trade Types & Styles

### Supported Trades
- General Contractor
- Plumber
- Electrician
- Roofer
- HVAC
- Painter
- Landscaper

### Style Options
- Professional (deep blue, trust-focused)
- Bold (high-energy, bright colors)
- Warm (earthy, approachable)
- Luxury (premium, elegant)

## Data Models

### User
- `id` (UUID, auto-generated)
- `email` (unique)
- `password` (hashed with bcrypt)
- `siteId` (foreign key to Site)

### Site (Enhanced)
- `id` (UUID, auto-generated)
- `subdomain` (unique)
- `customDomain` (optional)
- `businessName`
- `brandColor` (hex color)
- `services` (JSON array)
- `isPublished` (boolean)
- `tradeType` - contractor trade (plumber, electrician, etc.)
- `stylePreference` - chosen style (professional, bold, warm, luxury)
- `selectedPages` - JSON array of page slugs to include
- `businessStory`, `yearsInBusiness`, `uniqueSellingPoints`
- `serviceArea`, `serviceAreaRadius`, `certifications`
- `contactPhone`, `contactEmail`, `address`
- `businessHours`, `socialMedia`
- `enableChatbot`, `enableQuoteCalculator`, `enableAppointmentScheduler`

### OnboardingProgress
- Tracks current onboarding phase for each site
- Phases: welcome → business_basics → trade_detection → services → story → differentiators → service_area → contact_info → photos → style → pages → review

### SitePhoto
- `id`, `siteId`, `url`, `type` (project/team/before-after), `caption`

### Testimonial
- `id`, `siteId`, `customerName`, `quote`, `rating`, `projectType`

### ServicePricing
- `id`, `siteId`, `serviceName`, `description`, `priceType`, `minPrice`, `maxPrice`

### Appointment
- `id`, `siteId`, `customerName`, `email`, `phone`, `preferredDate`, `preferredTime`, `serviceType`, `message`, `status`

### ChatbotConversation
- `id`, `siteId`, `sessionId`, `messages` (JSON), `leadCaptured`

### Page (CMS)
- `id`, `siteId`, `slug`, `title`, `content` (JSON)

### Lead (Contact Form)
- `id`, `siteId`, `name`, `email`, `phone`, `message`

### Conversation/Message (AI Onboarding)
- Stores chat history for site generation

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
- `PATCH /api/tenant/settings/domain` - Update custom domain
- `POST /api/tenant/publish` - Toggle publish status
- `GET /api/tenant/pages` - List all pages for this tenant
- `GET /api/tenant/pages/:slug` - Get page by slug
- `PATCH /api/tenant/pages/:slug` - Update page content
- `GET /api/tenant/leads` - List leads for this tenant
- `GET /api/tenant/users` - List users for this tenant
- `POST /api/tenant/users` - Create user for this tenant

### Onboarding Routes (require session)
- `GET /api/onboarding/session` - Get current onboarding session
- `POST /api/onboarding/chat` - Chat with AI (streaming SSE)
- `POST /api/onboarding/generate` - Generate site from conversation
- `GET /api/onboarding/photos` - Get photos for current site
- `POST /api/onboarding/photos` - Upload photo for current site
- `POST /api/onboarding/preferences` - Save style/page preferences

### Public Tenant Routes
- `GET /api/site` - Get current tenant's site info
- `GET /api/site/pages/:slug` - Get page content
- `POST /api/site/leads` - Submit contact form
- `GET /api/tenant` - Check tenant detection status

### Appointment Routes (public)
- `POST /api/appointments` - Create appointment request
- `GET /api/appointments` - List appointments for tenant (admin)

### Chatbot Routes
- `POST /api/chatbot/message` - Send message to AI chatbot (streaming SSE)
- `POST /api/chatbot/capture-lead` - Capture lead from chatbot conversation

## Key Files

- `shared/schema.ts` - Database models and TypeScript types
- `shared/tradeTemplates.ts` - Trade templates with services, styles, certifications
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage layer with CRUD operations
- `server/routes.ts` - All API routes
- `server/middleware/tenantMiddleware.ts` - Hostname-based tenant detection + admin subdomain
- `server/seed.ts` - Database seeding with sample data
- `client/src/App.tsx` - Main React app with dual-mode routing (platform/tenant admin)
- `client/src/pages/admin/` - Platform admin dashboard pages
- `client/src/pages/tenant-admin/` - Tenant admin pages (Login, Dashboard, Settings, Users)
- `client/src/pages/Onboarding.tsx` - Enhanced AI onboarding with progress tracking
- `client/src/pages/PublicSite.tsx` - Spectacular public website template
- `client/src/components/TenantAdminLayout.tsx` - Tenant admin layout with sidebar

### Interactive Components
- `client/src/components/ChatBot.tsx` - AI sales chatbot with lead capture
- `client/src/components/QuoteCalculator.tsx` - Interactive price estimator
- `client/src/components/AppointmentScheduler.tsx` - Booking form
- `client/src/components/BeforeAfterSlider.tsx` - Before/after image comparison
- `client/src/components/ProjectGallery.tsx` - Filterable photo gallery with lightbox
- `client/src/components/ServiceAreaMap.tsx` - Service area display

### Onboarding Components
- `client/src/components/OnboardingProgress.tsx` - Phase progress indicator
- `client/src/components/PhotoUpload.tsx` - Drag-drop photo uploads
- `client/src/components/StylePicker.tsx` - 4 style options with previews
- `client/src/components/PageSelector.tsx` - Page selection checklist

## Development

The application seeds the database with sample data on startup:
- 3 sample sites (ACME, Bloom Wellness, TechPro)
- 4 sample users assigned to sites (password: "password123")

## Security

- All tenant admin API routes require admin subdomain access (`requireTenantAdmin`)
- Protected routes also require session authentication (`requireTenantAuth`)
- Session validates that user belongs to the current tenant (siteId match)
- SESSION_SECRET required in production (fails immediately if missing)

## Authentication (Clerk)

Clerk authentication is integrated for multi-tenant and multi-organization support:

### Frontend
- `ClerkProvider` wraps the app in `client/src/main.tsx`
- Uses `VITE_CLERK_PUBLISHABLE_KEY` environment variable
- Sign-in page: `/sign-in` (uses Clerk's `<SignIn />` component)
- Sign-up page: `/sign-up` (uses Clerk's `<SignUp />` component)
- Custom `useAuth` hook at `client/src/hooks/use-auth.ts` wraps Clerk hooks

### Backend
- Clerk middleware configured in `server/middleware/clerkMiddleware.ts`
- Applied globally in `server/index.ts`
- Uses `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` environment variables
- `isAuthenticated` middleware for protected routes
- `getAuth(req)` to get current user ID and org info
- `requireAuth` middleware for strict authentication enforcement

### Environment Variables Required
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key (starts with `pk_`)
- `CLERK_SECRET_KEY` - Clerk secret key (starts with `sk_`)

## Recent Changes
- 2026-01-31: Complete visual redesign with modern, sleek aesthetics
  - Updated CSS theme with blue gradient accents (221 83% 53%), glass-morphism effects, and smooth animations
  - Redesigned Landing page with gradient hero section, floating elements, stats, feature cards, 3-step how-it-works, testimonials grid, and modern footer
  - Enhanced SignUp page with split-panel layout (form + benefits with gradient background)
  - Modernized TenantAdminLayout with improved sidebar styling and badges for admin/live status
  - Updated tenant admin Login page with full-screen gradient background
  - Added comprehensive data-testid attributes for testing
  - Fixed all accessibility and design guideline compliance issues
- 2026-01-31: Major enhancement - "Best in Class" contractor website builder
  - Added comprehensive data model with trade types, style preferences, onboarding progress
  - Created trade templates system (7 trades x 4 styles) with default services, certifications, FAQs
  - Built enhanced onboarding UI with progress indicator, split-panel layout (chat + preview)
  - Implemented phase-based AI onboarding that asks one question at a time with deep follow-ups
  - Created 10 interactive components: ChatBot, QuoteCalculator, AppointmentScheduler, BeforeAfterSlider, ProjectGallery, ServiceAreaMap, StylePicker, PageSelector, PhotoUpload, OnboardingProgress
  - Built spectacular PublicSite template with sticky header, hero section, trust badges, services, about, testimonials, contact form, and AI chatbot integration
  - Added photo upload persistence, style/page selection, and appointment scheduling APIs
- 2026-01-31: Added tenant-specific admin portal at `admin.{subdomain}` with login, dashboard, settings, and user management
- 2026-01-30: Initial implementation of multi-tenant structure with User and Site models, hostname-based middleware, and platform admin dashboard
