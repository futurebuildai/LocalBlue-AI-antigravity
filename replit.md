# LocalBlue Platform

## Overview
LocalBlue is a multi-tenant website builder platform specifically designed for local general and trade contractors (primarily residential). Its core purpose is to empower contractors to manage their professional websites directly from their custom domain (e.g., `admin.smithplumbing.com`) after an initial setup, eliminating the need to return to the LocalBlue platform itself. The platform supports both a global Platform Admin for the LocalBlue team and individual Tenant Admins for each contractor. The project's vision is to deliver "Best in Class" contractor website builder capabilities, leveraging AI for an intuitive and powerful user experience.

## User Preferences
None

## System Architecture

### Core Design Principles
- **Multi-tenancy**: Designed for multiple independent contractor websites, each with its own admin panel and data.
- **AI-driven Onboarding**: Utilizes AI for interactive onboarding to gather business details and generate website content.
- **Custom Domain Management**: Contractors manage their sites directly from their custom domain, abstracting away the LocalBlue platform post-creation.
- **Modern Web Technologies**: Leverages a modern stack for backend and frontend development.

### Backend
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**:
    - **Platform Admin**: Replit Auth via OpenID Connect, restricted to platform admin emails.
    - **Tenant Admin**: Email/password auth via bcrypt + express-session, specific to `admin.{subdomain}` domains.
    - **Session Store**: PostgreSQL-backed (`connect-pg-simple`).
- **Multi-Tenant Middleware**: Hostname-based detection routes requests to the correct tenant context.

### Frontend
- **Framework**: React with Vite
- **UI/UX**:
    - **Components**: Shadcn/ui for consistent components.
    - **Styling**: Tailwind CSS.
    - **Design**: Modern aesthetics with blue gradient accents, glass-morphism effects, and animations. Features redesigned Landing, SignUp, and TenantAdminLayout.
    - **Public Site Templates**: Flexible templates with sticky headers, hero sections, trust badges, services, testimonials, contact forms, and AI chatbot integration. Supports trade-specific images and aesthetic styles (luxury, bold, warm, professional) with 4 distinct layouts.
    - **Interactive Components**: ChatBot, QuoteCalculator, AppointmentScheduler, BeforeAfterSlider, ProjectGallery, ServiceAreaMap, StylePicker, PageSelector, PhotoUpload, OnboardingProgress.
    - **Mobile Optimization**: Fully mobile-responsive design with touch-friendly controls, mobile navigation, responsive grids, and sticky mobile CTAs.
- **State Management**: TanStack React Query
- **Routing**: Wouter

### Key Features
- **AI Onboarding**: Interactive chat-based process with AI for business details, service areas, and content generation, including progress tracking.
- **Site Generation**: AI extracts business details to automatically create website pages.
- **Tenant Admin Panel**: Provides each contractor with a panel for site management (editing pages, leads, users, settings, custom domain, publishing).
- **Public Website Customization**: Supports various trade types and aesthetic styles.
- **Interactive Tools**: Built-in AI sales chatbot, quote calculator, appointment scheduler, before/after image slider, and filterable project gallery.
- **SEO Optimization**: Dynamic title, description, Open Graph, Twitter cards, and JSON-LD structured data.
- **Site Analytics**: Traffic tracking, daily rollup dashboards, device/referrer/page analytics, SEO keyword tracking, AI-powered monthly optimization.
- **Lead CRM**: Pipeline management (New→Contacted→Quoted→Won/Lost), priority tagging, source tracking, notes/activity log, follow-up reminders, estimated values, conversion metrics.
- **Iterative Site Feedback**: Users can preview generated sites and provide feedback to AI for content regeneration.
- **Enhanced Service Cards**: Include photo thumbnails, AI-generated FAQs, and "View Gallery" links.

### Data Models
Key entities include `User`, `Site`, `OnboardingProgress`, `SitePhoto`, `Testimonial`, `ServicePricing`, `Appointment`, `ChatbotConversation`, `Page`, `Lead`, `AnalyticsEvent`, `AnalyticsDaily`, `SeoMetric`, `SeoOptimization`, and `LeadNote`. These models support comprehensive business, content, interaction, analytics, SEO, and lead management.

## External Dependencies
- **PostgreSQL**: Primary database.
- **Drizzle ORM**: Database interaction.
- **Claude Opus 4.5**: AI model for onboarding and content generation.
- **Resend**: For sending lead notification emails.
- **Replit Auth**: Secure user authentication via OpenID Connect.
- **Stripe**: Payment processing and subscription management, including `stripe-replit-sync` for data synchronization.