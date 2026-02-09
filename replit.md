# LocalBlue Platform

## Overview
LocalBlue is a website builder platform designed for local general contractors and trade contractors (mostly residential). Its core differentiator is enabling contractors to manage their websites directly from their custom domain (e.g., `admin.smithplumbing.com`) after initial setup, rather than requiring them to return to the LocalBlue platform. The platform supports both a global Platform Admin for the LocalBlue team and individual Tenant Admins for each contractor. The project aims to provide "Best in Class" contractor website builder capabilities.

## User Preferences
None

## System Architecture

### Core Design Principles
- **Multi-tenancy**: The platform is built from the ground up to support multiple independent contractor websites, each with its own administrative panel and data.
- **AI-driven Onboarding**: Utilizes advanced AI for an interactive onboarding process to gather business details and generate website content.
- **Custom Domain Management**: Contractors manage their sites directly from their custom domain, abstracting away the LocalBlue platform post-creation.
- **Modern Web Technologies**: Leverages a modern stack for both backend and frontend development to ensure scalability, performance, and a rich user experience.

### Backend
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication (Multi-Tenant)**:
    - **Platform Admin (main site)**: Replit Auth via OpenID Connect. Users log in at `/api/login`, authenticated via OIDC, user data stored in `users` table. Platform admin access restricted by `PLATFORM_ADMIN_EMAILS` env var. OIDC routes (`/api/login`, `/api/callback`, `/api/logout`) are domain-restricted — only available on the main domain, blocked on tenant domains via `isTenantDomain()` check.
    - **Tenant Admin**: Email/password auth via bcrypt + express-session. Tenant admins log in at `/api/tenant/auth/login` on their `admin.{subdomain}` domain. Session stores `userId` + `siteId`.
    - **Session Store**: PostgreSQL-backed via `connect-pg-simple` (`sessions` table). Both auth systems share the session store but use different session fields to avoid conflicts. Cookie domain defaults to current host, naturally isolating sessions between main and tenant domains.
    - **Frontend Guards**: `PlatformAdminGuard` checks both Replit Auth authentication AND admin API authorization before rendering admin UI. `TenantAdminApp` uses its own auth check via `/api/tenant/auth/me`.
- **Multi-Tenant Middleware**: Hostname-based detection (`admin.{subdomain}` or `admin.{customDomain}`) to route requests to the correct tenant context.

### Frontend
- **Framework**: React with Vite
- **UI/UX**:
    - **Components**: Shadcn/ui for a consistent and modern component library.
    - **Styling**: Tailwind CSS for utility-first styling.
    - **Design**: Modern, sleek aesthetics with blue gradient accents, glass-morphism effects, and smooth animations. Includes a redesigned Landing page, SignUp page, and TenantAdminLayout.
    - **Public Site Template**: Spectacular template with sticky header, hero section, trust badges, services, testimonials, contact form, and AI chatbot integration. Features trade-specific hero images and style preference visual treatments (luxury, bold, warm, professional).
    - **Interactive Components**: ChatBot, QuoteCalculator, AppointmentScheduler, BeforeAfterSlider, ProjectGallery, ServiceAreaMap, StylePicker, PageSelector, PhotoUpload, OnboardingProgress.
    - **Mobile Optimization**: All pages are fully mobile-responsive (400px+ viewport support). Key patterns:
        - Touch-friendly controls with 44px minimum tap targets
        - Mobile navigation via hamburger menus and collapsible sidebars
        - Responsive grids (2-column on mobile, 3-4 column on desktop)
        - Tables converted to card layouts on mobile
        - Full-width buttons and form inputs on mobile
        - Horizontal scroll for data tables where needed
        - Sticky mobile CTA bars on public sites
- **State Management**: TanStack React Query
- **Routing**: Wouter

### Key Features
- **AI Onboarding**: Interactive chat-based process with Claude Opus 4.5 for business details, service areas, and content generation. Includes progress tracking and phase-based questioning.
- **Site Generation**: AI extracts business details to create website pages automatically.
- **Tenant Admin Panel**: Each contractor gets an admin panel for site management (editing pages, viewing leads, managing users, updating settings, custom domain connection, publishing status).
- **Public Website Customization**: Supports various trade types (General Contractor, Plumber, Electrician, Roofer, HVAC, Painter, Landscaper) and aesthetic styles (Professional, Bold, Warm, Luxury).
- **Interactive Tools**: Built-in AI sales chatbot, quote calculator, appointment scheduler, before/after image slider, and filterable project gallery.
- **SEO Optimization**: Dynamic title, description, Open Graph, Twitter cards, and JSON-LD structured data.
- **Site Analytics**: Traffic tracking, daily rollup dashboards, device/referrer/page analytics, SEO keyword tracking, AI-powered monthly optimization with cross-site learning.
- **Lead CRM**: Pipeline management (New→Contacted→Quoted→Won/Lost), priority tagging, source tracking, notes/activity log, follow-up reminders, estimated values, conversion metrics.

### Data Models
Key entities include `User`, `Site`, `OnboardingProgress`, `SitePhoto`, `Testimonial`, `ServicePricing`, `Appointment`, `ChatbotConversation`, `Page`, `Lead`, `AnalyticsEvent`, `AnalyticsDaily`, `SeoMetric`, `SeoOptimization`, and `LeadNote`. These models capture comprehensive information for contractors' businesses, website content, customer interactions, analytics tracking, SEO performance, and lead management.

### Recent Changes (Feb 2026)
- **Total Years Experience**: Added `totalYearsExperience` field to `sites` table. This captures total professional experience including apprenticeship and prior work, not just years the business has been operating. The AI extraction prompt asks for this explicitly. The public site displays `totalYearsExperience` (falling back to `yearsInBusiness` if not set). The value is guaranteed to be >= `yearsInBusiness`.
- **Service Descriptions**: Improved AI content generation prompt to produce unique, varied descriptions for each service card instead of repetitive templated text. Fallback descriptions now use an array of 6 varied templates instead of one repeated pattern.
- **Photo Integration**: Uploaded logos display in site header, gallery section added with categorized photos (Projects, Before & After, Team). `/api/site/photos` endpoint serves public photos. `ProjectGallery` component renders photos grouped by category.
- **Onboarding AI Improvements**: Added explicit photo upload acknowledgment in prompts, phase-waiting rules to prevent skipping user responses (especially during photos/style/generate phases).
- **Stats Verification**: Removed fabricated metrics (project counts calculated from years, hardcoded satisfaction/rating). TrustBadgesBar now only shows: Years Experience (if available), Licensed/Insured badge, Service Area, Free Estimates.
- **Trade Type Consistency**: Added `tradeLabel` field to preserve user's specific trade description (e.g., "Finish Carpenter" vs generic "General Contractor"). Extraction and content generation prompts use consistent terminology.
- **Hero Section Cleanup**: Removed duplicate trust badges from hero bottom (years experience, star rating) since they appear in header badge and TrustBadgesBar section below.
- **Site Analytics Engine**: Added lightweight page view tracking on public sites with analytics dashboard in tenant admin showing traffic metrics, charts, top pages, referrers, and device breakdown. Tables: `analytics_events`, `analytics_daily`.
- **SEO Optimization System**: Monthly AI-powered SEO analysis that compares site performance against cross-site averages and auto-applies safe improvements (meta tags, titles). Cross-site learning from high-performing sites. Tables: `seo_metrics`, `seo_optimizations`.
- **Lead Management CRM**: Extended leads with pipeline stages (New/Contacted/Quoted/Won/Lost), priority levels, source tracking, follow-up reminders, estimated values, and activity notes. Replaced basic leads list with full CRM dashboard including metrics and pipeline visualization. Tables: `lead_notes` (new), `leads` (extended with stage, priority, source, nextFollowUpAt, lastContactedAt, assignedTo, estimatedValue).
- **AI Website Editor Vision**: Planned premium tier feature for builder.io-style visual CMS with AI content assistant in tenant admin.

### Pricing & Subscription Model

**Pricing Tiers (All include Unlimited Leads):**

| Plan | Monthly | Annual | Core Value | Key Features |
|------|---------|--------|------------|--------------|
| Starter | $49 | $490 ($41/mo) | Professional Presence | Contact forms, appointment requests, project gallery, SEO |
| Growth | $99 | $990 ($82/mo) | Lead Automation | AI Sales Chatbot 24/7, before/after galleries, testimonials |
| Scale | $199 | $1,990 ($165/mo) | Local Dominance | Instant quote calculator, service pricing display, multi-service pages |

**Graduated Trial Model:**
- **Phase 1: "Test Drive" (30 days)** - Site on `yourbusiness.localblue.co`, no credit card required
- **Phase 2: "Professional Launch" (14 days)** - Custom domain connection, credit card required, 14 days free before billing

**Annual Discount Strategy:**
- "2 Months Free" model (10 months pricing)
- Launch as "Founding Partner Plan" with price locked for life

**Schema Fields:** `subscriptionPlan`, `trialPhase`, `trialStartDate`, `trialEndDate`, `hasCreditCard`, `billingPeriod`

### Documentation
- **Product Memo:** See `docs/PRODUCT_MEMO.md` for comprehensive vision, pricing strategy, and business case

### Stripe Payment Integration

**Architecture:**
- Uses `stripe-replit-sync` for automatic data synchronization between Stripe and PostgreSQL
- Stripe data is synced to `stripe.*` schema tables (products, prices, subscriptions, customers, payment_intents)
- Webhook registered before `express.json()` middleware for raw body access

**Key Files:**
- `server/stripeClient.ts`: Stripe sync client initialization
- `server/webhookHandlers.ts`: Webhook event processing
- `server/stripeRoutes.ts`: API routes for checkout, portal, subscription status, and revenue dashboard
- `server/seed-stripe-products.ts`: Product seeding script (run with `npx tsx server/seed-stripe-products.ts`)

**API Endpoints:**
- `GET /api/stripe/publishable-key`: Returns Stripe publishable key
- `GET /api/stripe/products`: Returns LocalBlue subscription products from synced data
- `POST /api/stripe/checkout`: Creates checkout session for a site
- `POST /api/stripe/portal`: Creates customer billing portal session
- `GET /api/stripe/subscription/:siteId`: Returns subscription status for a site
- `GET /api/admin/revenue`: Platform Admin revenue dashboard data

**Revenue Dashboard:**
- Located at `/admin/revenue` in Platform Admin
- Displays MRR, active subscriptions, customer count, conversion rate
- Shows revenue chart (last 6 months) and recent payments
- Subscription breakdown by plan and trial phase

## Future Roadmap (from Beta Feedback - TM:4, Feb 2026)

### Photo Gallery Page
- Uploaded photos during onboarding land in a basic gallery section but there's no dedicated gallery page on the generated site yet.
- Photo categories (Projects, Before/Afters, Team) should translate directly into a gallery page with the same delineations.
- Consider using uploaded hero/project photos in the home page hero image as well.

### Post-Generation Feedback Loop
- After site generation, bounce the user into a feedback/suggestions flow where they can tell us what they like, don't like, or want changed.
- This could drive iterative AI-based refinements before the site goes live.

### "Projects Completed Per Year" Onboarding Question
- Add a question during onboarding: "On average, how many homes do you build per year?"
- This gives insight into company size and can be leveraged in multiple areas (trust badges, about section, stats).

### More Unique Styling Per Site
- Beta feedback notes that generated sites look very similar with only minor copy variations.
- Consider supplying a few templated visual examples of what each "style" represents to give the AI more stylistic direction.
- Investigate ways to vary layout structure, section ordering, and visual treatments more dramatically between style preferences.

### Expert Services Cards Enhancement
- Consider connecting service cards to correlated gallery photos or FAQs for each specific service focus.
- This would make the services section more valuable and less generic.

## External Dependencies
- **PostgreSQL**: Primary database for all application data.
- **Drizzle ORM**: Used for database interactions.
- **Claude Opus 4.5**: AI model used for the interactive onboarding process and content generation.
- **Resend**: Integrated for sending lead notification emails.
- **Replit Auth**: Utilized for secure user authentication via OpenID Connect.
- **Stripe**: Payment processing and subscription management via Replit connector with automatic data sync.