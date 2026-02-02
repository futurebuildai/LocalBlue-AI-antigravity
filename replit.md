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
- **Authentication**: bcrypt for password hashing, express-session for tenant admin sessions. Replit Auth integrated via OpenID Connect for user authentication, storing user data in PostgreSQL.
- **Multi-Tenant Middleware**: Hostname-based detection (`admin.{subdomain}` or `admin.{customDomain}`) to route requests to the correct tenant context.

### Frontend
- **Framework**: React with Vite
- **UI/UX**:
    - **Components**: Shadcn/ui for a consistent and modern component library.
    - **Styling**: Tailwind CSS for utility-first styling.
    - **Design**: Modern, sleek aesthetics with blue gradient accents, glass-morphism effects, and smooth animations. Includes a redesigned Landing page, SignUp page, and TenantAdminLayout.
    - **Public Site Template**: Spectacular template with sticky header, hero section, trust badges, services, testimonials, contact form, and AI chatbot integration. Features trade-specific hero images and style preference visual treatments (luxury, bold, warm, professional).
    - **Interactive Components**: ChatBot, QuoteCalculator, AppointmentScheduler, BeforeAfterSlider, ProjectGallery, ServiceAreaMap, StylePicker, PageSelector, PhotoUpload, OnboardingProgress.
- **State Management**: TanStack React Query
- **Routing**: Wouter

### Key Features
- **AI Onboarding**: Interactive chat-based process with Claude Opus 4.5 for business details, service areas, and content generation. Includes progress tracking and phase-based questioning.
- **Site Generation**: AI extracts business details to create website pages automatically.
- **Tenant Admin Panel**: Each contractor gets an admin panel for site management (editing pages, viewing leads, managing users, updating settings, custom domain connection, publishing status).
- **Public Website Customization**: Supports various trade types (General Contractor, Plumber, Electrician, Roofer, HVAC, Painter, Landscaper) and aesthetic styles (Professional, Bold, Warm, Luxury).
- **Interactive Tools**: Built-in AI sales chatbot, quote calculator, appointment scheduler, before/after image slider, and filterable project gallery.
- **SEO Optimization**: Dynamic title, description, Open Graph, Twitter cards, and JSON-LD structured data.

### Data Models
Key entities include `User`, `Site`, `OnboardingProgress`, `SitePhoto`, `Testimonial`, `ServicePricing`, `Appointment`, `ChatbotConversation`, `Page`, and `Lead`. These models capture comprehensive information for contractors' businesses, website content, and customer interactions.

### Pricing & Subscription Model

**Pricing Tiers (All include Unlimited Leads):**

| Plan | Monthly | Annual | Core Value | Key Features |
|------|---------|--------|------------|--------------|
| Starter | $49 | $490 ($41/mo) | Professional Presence | Standard forms, manual booking, 1 admin seat |
| Growth | $99 | $990 ($82/mo) | Lead Automation | AI Sales Chatbot, calendar sync, 3 admin seats |
| Scale | $199 | $1,990 ($165/mo) | Local Dominance | Quote calculator, service-area maps, unlimited seats |

**Graduated Trial Model:**
- **Phase 1: "Test Drive" (30 days)** - Site on `yourbusiness.localblue.co`, no credit card required
- **Phase 2: "Professional Launch" (14 days)** - Custom domain connection, credit card required, 14 days free before billing

**Annual Discount Strategy:**
- "2 Months Free" model (10 months pricing)
- Launch as "Founding Partner Plan" with price locked for life

**Schema Fields:** `subscriptionPlan`, `trialPhase`, `trialStartDate`, `trialEndDate`, `hasCreditCard`, `billingPeriod`

### Documentation
- **Product Memo:** See `docs/PRODUCT_MEMO.md` for comprehensive vision, pricing strategy, and business case

## External Dependencies
- **PostgreSQL**: Primary database for all application data.
- **Drizzle ORM**: Used for database interactions.
- **Claude Opus 4.5**: AI model used for the interactive onboarding process and content generation.
- **Resend**: Integrated for sending lead notification emails.
- **Replit Auth**: Utilized for secure user authentication via OpenID Connect.