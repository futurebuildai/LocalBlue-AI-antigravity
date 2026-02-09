# LocalBlue North Star Product Vision

**The Definitive Spec Document**

**Document Version:** 1.0
**Date:** February 2026
**Status:** Living Document — Single Source of Truth
**Classification:** Internal

---

## Table of Contents

1. [Vision & Mission](#1-vision--mission)
2. [The Problem We Solve](#2-the-problem-we-solve)
3. [Platform Overview & Key Differentiators](#3-platform-overview--key-differentiators)
4. [Complete User Stories](#4-complete-user-stories)
5. [Complete Page & Screen Inventory](#5-complete-page--screen-inventory)
6. [Complete User Flows](#6-complete-user-flows)
7. [Pricing & Subscription Model](#7-pricing--subscription-model)
8. [Supported Trade Types & Style System](#8-supported-trade-types--style-system)
9. [AI & Automation Strategy](#9-ai--automation-strategy)
10. [SEO & Discoverability](#10-seo--discoverability)
11. [Interactive Components Deep Dive](#11-interactive-components-deep-dive)
12. [Product Roadmap Vision](#12-product-roadmap-vision)
13. [Success Metrics](#13-success-metrics)
14. [Analytics & Lead Management Systems](#14-analytics--lead-management-systems)

---

## 1. Vision & Mission

### North Star

> **Become the default digital presence platform for the trades industry.**

LocalBlue is a niche Platform-as-a-Service (PaaS) that abstracts all technical complexity behind AI-powered chat. A non-technical contractor can build an entire professional web presence, become more discoverable, and win more leads — all from their own domain, without ever logging into a "platform" after initial domain setup.

### Mission Statement

> Empower every local contractor to have a professional online presence that generates leads — without technical skills, design expertise, or ongoing maintenance burden.

### Core Values

| Value | Principle |
|-------|-----------|
| **Simplicity First** | If a contractor can't do it in 60 seconds, we redesign it |
| **Invisible Infrastructure** | Contractors see their brand, never ours. White-label everything |
| **AI as Co-pilot** | AI handles complexity, humans make decisions |
| **Results Over Features** | Every feature must generate leads or save time |

### The Niche PaaS Concept

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOCALBLUE = NICHE PaaS                      │
│                                                                 │
│   Heavy Abstraction  +  AI Chat  =  Non-Technical Contractor    │
│                                      Can Build Entire Web       │
│                                      Presence in Minutes        │
│                                                                 │
│   ┌───────────────┐   ┌──────────┐   ┌────────────────────┐    │
│   │  Hosting       │   │  DNS     │   │  SSL Certificates  │    │
│   │  Deployment    │   │  CDN     │   │  SEO Configuration │    │
│   │  Database      │   │  Email   │   │  Analytics Setup   │    │
│   └───────────────┘   └──────────┘   └────────────────────┘    │
│          ↑                  ↑                   ↑               │
│          └──────────────────┴───────────────────┘               │
│                    ALL INVISIBLE TO USER                         │
│                                                                 │
│   Contractor sees:  "Chat with AI → Website Live → Leads Flow" │
└─────────────────────────────────────────────────────────────────┘
```

### Vision (3-5 Year)

Expand from website builder to full business operations suite:

- AI-powered lead management and follow-up
- Reputation management and review collection
- Scheduling and dispatch optimization
- Payment processing and invoicing
- Customer relationship management

---

## 2. The Problem We Solve

### The Contractor's Dilemma

| Challenge | Impact |
|-----------|--------|
| **No technical skills** | Can't build or maintain a website themselves |
| **Limited time** | Running jobs 50-70+ hours/week, no time to learn |
| **Budget conscious** | Can't afford $3-15K agency websites |
| **Bad past experiences** | Burned by overpriced, underdelivering solutions |
| **Trust issues** | Skeptical of "tech solutions" that over-promise |

### The Underserved Market

```
┌──────────────────────────────────────────────────────────┐
│                  THE OPPORTUNITY                          │
│                                                          │
│   3.7M  contractor businesses in the US                  │
│    82%  have no website or an outdated one                │
│  $2.1B  annual spend on contractor marketing             │
│    67%  of homeowners research contractors online first   │
│    73%  won't consider a contractor without a website     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Why Existing Solutions Fail

| Solution | Problem |
|----------|---------|
| **Squarespace / Wix** | Too complex, generic templates, requires hours of learning |
| **WordPress** | Overwhelming, needs a developer for customization |
| **Agencies** | Expensive ($3-15K upfront), slow (4-8 weeks), ongoing costs |
| **Thumbtack / HomeAdvisor** | Lead marketplaces, not owned presence, high per-lead costs |
| **GoDaddy Website Builder** | Poor quality, spam-like results |
| **ServiceTitan** | Overkill for small shops, complex, $300+/mo |

### Target Persona: "Mike the Master Plumber"

| Attribute | Detail |
|-----------|--------|
| **Age** | 35-55 |
| **Business Size** | 1-10 employees |
| **Annual Revenue** | $150K - $2M |
| **Location** | Suburban/urban areas |
| **Tech Comfort** | Basic (email, smartphone) |
| **Work Hours** | 50-70 hours/week |
| **Values** | Craftsmanship, reputation, word-of-mouth |
| **Attitude** | Skeptical of marketing "gurus", prefers no-BS communication |

**Mike's Goals:**
- Get more quality leads
- Look professional online
- Spend less time on marketing
- Compete with larger companies
- Focus on actual work, not admin

**Mike's Frustrations:**
- "I'm a plumber, not a web designer"
- "Previous website cost me $5K and looks outdated"
- "I don't have time to figure out WordPress"
- "Lead services send me garbage leads"

---

## 3. Platform Overview & Key Differentiators

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CHAT WITH AI (5 min)                                        │
│     Contractor answers questions about their business           │
│     AI extracts: services, service areas, unique selling points │
└─────────────────────────────────────────────────────────────────┘
                              |
                              v
┌─────────────────────────────────────────────────────────────────┐
│  2. AI GENERATES WEBSITE                                        │
│     Professional design + all content created automatically     │
│     Optimized for their specific trade and location             │
└─────────────────────────────────────────────────────────────────┘
                              |
                              v
┌─────────────────────────────────────────────────────────────────┐
│  3. MANAGE FROM CUSTOM DOMAIN                                   │
│     Contractor accesses admin.theirsite.com                     │
│     LocalBlue branding is invisible to their customers          │
└─────────────────────────────────────────────────────────────────┘
                              |
                              v
┌─────────────────────────────────────────────────────────────────┐
│  4. LEADS FLOW IN                                               │
│     AI chatbot qualifies visitors 24/7                          │
│     Quote calculator captures project details                   │
│     Appointment scheduler books consultations                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Differentiators

| Feature | LocalBlue | Competitors |
|---------|-----------|-------------|
| **AI-First Creation** | Chat to website in 5 min | Hours/days of manual work |
| **White-Label Admin** | Manage from your domain (`admin.theirsite.com`) | Always on platform's domain |
| **Trade-Specific** | Built for 7 trades with deep templates | Generic business templates |
| **Lead Generation** | AI chatbot, quote calc, scheduler | Basic contact forms |
| **Mobile-First** | 100% responsive, 400px+ viewport | Often compromised on mobile |
| **SEO Built-In** | Local SEO optimized out of the box | Requires plugins/expertise |
| **Unlimited Leads** | No caps, no per-lead fees | Capped or pay-per-lead |
| **Time to Launch** | 5 minutes | 4 hours to 8 weeks |

### Feature Set by Category

**Website Building:**
- AI-powered content generation from conversation
- Trade-specific templates (7 trades)
- Style preferences (Professional, Bold, Warm, Luxury)
- Photo upload with categorization (logo, team, project, before/after, hero, service)
- Mobile-responsive design
- Custom domain connection with SSL

**Lead Generation:**
- AI sales chatbot (24/7 lead qualification)
- Quote calculator widget
- Appointment scheduling
- Contact forms with email alerts
- Before/after project gallery
- Service area mapping

**Admin & Management:**
- White-label admin panel on tenant domain
- Lead management dashboard
- User/team management
- Page editor
- Site settings and customization
- Publish/unpublish control

**Technical Infrastructure:**
- SSL/HTTPS included
- SEO optimization (meta, Open Graph, JSON-LD structured data)
- Multi-tenant architecture
- Stripe billing integration
- Resend email notifications
- Cloudflare DNS management

---

## 4. Complete User Stories

### 4.1 Platform Admin (LocalBlue Team)

#### Current

| ID | User Story | Status |
|----|-----------|--------|
| PA-01 | As a platform admin, I can view all contractor sites and their status (published/draft) | Built |
| PA-02 | As a platform admin, I can manage platform users and assign admin roles | Built |
| PA-03 | As a platform admin, I can view a revenue dashboard with MRR, active subscriptions, payments, and conversion metrics | Built |
| PA-04 | As a platform admin, I can view detailed site info including leads, onboarding progress, pages, users, and photos | Built |
| PA-05 | As a platform admin, I can impersonate a tenant admin to troubleshoot their account | Built |
| PA-06 | As a platform admin, I can create, edit, and delete sites manually | Built |
| PA-07 | As a platform admin, I can toggle a site's publish status | Built |
| PA-08 | As a platform admin, I can view and manage subscription and billing data per site | Built |
| PA-09 | As a platform admin, I can search and filter the sites list by trade type, status, or name | Built |
| PA-10 | As a platform admin, I can view a summary dashboard with total sites, published/draft counts, and total users | Built |

#### Future

| ID | User Story | Priority |
|----|-----------|----------|
| PA-F01 | As a platform admin, I can manage templates and trade configurations | Medium |
| PA-F02 | As a platform admin, I can view platform-wide analytics and health metrics | High |
| PA-F03 | As a platform admin, I can manage support tickets | Medium |
| PA-F04 | As a platform admin, I can bulk-manage sites (bulk publish, bulk email) | Low |
| PA-F05 | As a platform admin, I can configure onboarding AI prompts and behavior | Medium |

---

### 4.2 Contractor (Tenant Admin)

#### Current

| ID | User Story | Status |
|----|-----------|--------|
| TA-01 | As a contractor, I can sign up with email, password, and business name and get a site created instantly with an auto-generated subdomain | Built |
| TA-02 | As a contractor, I can go through an AI-powered onboarding chat that asks about my business in a structured 5-15 minute conversation | Built |
| TA-03 | As a contractor, I can upload photos (logo, team, projects, before/after) during onboarding | Built |
| TA-04 | As a contractor, I can choose my visual style from 4 options (Professional, Bold, Warm, Luxury) | Built |
| TA-05 | As a contractor, I can select which pages to include on my site from a list of 12 available page types | Built |
| TA-06 | As a contractor, I can generate my complete website with AI-created content after onboarding | Built |
| TA-07 | As a contractor, I can log into my admin panel at `admin.mybusiness.com` with email/password | Built |
| TA-08 | As a contractor, I can view my dashboard with site status, public URL, lead count (total, this month, new), and quick actions | Built |
| TA-09 | As a contractor, I can manage and edit my website pages | Built |
| TA-10 | As a contractor, I can view leads with name, email, phone, message, and date | Built |
| TA-11 | As a contractor, I can manage team members/users | Built |
| TA-12 | As a contractor, I can update site settings (business name, brand color, services list) | Built |
| TA-13 | As a contractor, I can connect a custom domain via guided DNS setup | Built |
| TA-14 | As a contractor, I can publish/unpublish my site | Built |
| TA-15 | As a contractor, I can manage appointments | [Backend Only] |

#### Future

| ID | User Story | Priority |
|----|-----------|----------|
| TA-F01 | As a contractor, I can manage testimonials (add, edit, show/hide) | High |
| TA-F02 | As a contractor, I can configure service pricing for the quote calculator | High |
| TA-F03 | As a contractor, I can view analytics and traffic data | High |
| TA-F04 | As a contractor, I can manage my subscription and billing (upgrade, downgrade, cancel) | High |
| TA-F05 | As a contractor, I can configure AI chatbot behavior, personality, and FAQs | Medium |
| TA-F06 | As a contractor, I can manage before/after photo pairs | Medium |
| TA-F07 | As a contractor, I can set up email notifications for new leads | High |
| TA-F08 | As a contractor, I can integrate with Google Business Profile | Medium |
| TA-F09 | As a contractor, I can manage reviews and reputation | Medium |
| TA-F10 | As a contractor, I can manage a blog with SEO-optimized posts | Low |
| TA-F11 | As a contractor, I can view lead source attribution (form, chatbot, quote, appointment) | Medium |
| TA-F12 | As a contractor, I can receive push/SMS notifications for new leads | Medium |

---

### 4.3 Visitor (Homeowner)

#### Current

| ID | User Story | Status |
|----|-----------|--------|
| V-01 | As a visitor, I can view a professional contractor website with hero, services, about, gallery, testimonials, and contact sections | Built |
| V-02 | As a visitor, I can submit a contact form to request service (name, email, phone, message) | Built |
| V-03 | As a visitor, I can chat with an AI assistant 24/7 that qualifies my needs and captures my contact info | Built |
| V-04 | As a visitor, I can use a quote calculator to estimate project costs by selecting service, project size, and urgency | Built |
| V-05 | As a visitor, I can schedule an appointment online by selecting date, time slot, service type, and providing contact info | Built |
| V-06 | As a visitor, I can view before/after project photos with an interactive slider comparison | Built |
| V-07 | As a visitor, I can see the contractor's service area with a list of cities served | Built |
| V-08 | As a visitor, I can view the site on mobile with full responsiveness and a sticky mobile CTA bar | Built |
| V-09 | As a visitor, I can browse a filterable project gallery with lightbox viewing (Projects, Before & After, Team) | Built |
| V-10 | As a visitor, I can read customer testimonials with star ratings | Built |

#### Future

| ID | User Story | Priority |
|----|-----------|----------|
| V-F01 | As a visitor, I can read and leave reviews | Medium |
| V-F02 | As a visitor, I can pay deposits or invoices online | High |
| V-F03 | As a visitor, I can track project status | Low |
| V-F04 | As a visitor, I can view financing options and apply online | Low |
| V-F05 | As a visitor, I can share the contractor's site easily on social media | Low |

---

## 5. Complete Page & Screen Inventory

### 5.1 Main Platform (localblue.co)

#### Landing Page (`/`)

| Section | Description |
|---------|-------------|
| **Sticky Navigation** | Logo, nav links (Features, Pricing, Demo, FAQ), Login/Get Started buttons, mobile hamburger menu |
| **Hero Section** | Typewriter effect cycling trade types ("plumber", "electrician", etc.), headline, subheadline, dual CTA buttons ("Get Started Free" + "Watch Demo"), floating trade icons animation |
| **Feature Showcase** | Grid of key features with icons and descriptions |
| **How It Works** | 3-step process: Chat with AI, AI Generates, Manage from Domain |
| **Pricing Cards** | 3-tier pricing (Starter $49/Growth $99/Scale $199), feature comparison, annual toggle, CTA per tier |
| **Testimonials** | Customer quotes with avatars |
| **FAQ Accordion** | Common questions and answers |
| **CTA Section** | Final call-to-action with "Get Started Free" |
| **Contact Sales Dialog** | Modal dialog for enterprise/custom inquiries |
| **Footer** | Logo, links, copyright |

#### Sign Up Page (`/signup`)

| Element | Description |
|---------|-------------|
| **Form Fields** | Email, password (min 8 chars), business name (min 2 chars) |
| **Validation** | Zod schema with real-time error messages |
| **Action** | Creates account + auto-creates site with subdomain + redirects to onboarding |
| **Benefits Sidebar** | 30-day free trial, no CC required, AI-powered |

#### Login Page (`/login`)

| Element | Description |
|---------|-------------|
| **Auth Flow** | Redirects to Replit Auth OIDC flow for platform admins |
| **Scope** | Platform admin access only (tenant login is separate) |

#### Onboarding Page (`/onboarding`)

| Element | Description |
|---------|-------------|
| **AI Chat Interface** | Full-screen chat with the AI onboarding assistant |
| **Progress Tracker** | Visual progress bar showing completed/current/upcoming phases |
| **12 Phases** | welcome, business_basics, trade_detection, services, story, differentiators, service_area, style, pages, photos, review, complete |
| **Style Picker** | Interactive card selector for 4 visual styles (appears during `style` phase) |
| **Page Selector** | Checkbox grid of 12 available pages with descriptions (appears during `pages` phase) |
| **Photo Upload** | Multi-photo uploader with type categorization (appears during `photos` phase) |
| **Generate Button** | "Generate Website" CTA at review/complete phase |

#### Demo Page (`/demo`)

| Element | Description |
|---------|-------------|
| **Interactive Preview** | Shows what a generated contractor site looks like |
| **Video Modal** | Onboarding demo video playback |

#### Preview Page (`/preview/:subdomain`)

| Element | Description |
|---------|-------------|
| **Site Preview** | Full rendered preview of a specific site by subdomain |
| **Admin Link** | Link to manage the site in tenant admin |

---

### 5.2 Platform Admin Panel (`/admin/*`)

Access: Replit Auth (OIDC) for LocalBlue team members.

#### Dashboard (`/admin`)

| Element | Description |
|---------|-------------|
| **Stats Cards** | Total sites, published sites, draft sites, total platform users |
| **Recent Activity** | Latest site creations and updates |

#### Sites List (`/admin/sites`)

| Element | Description |
|---------|-------------|
| **Search & Filter** | Search by business name, filter by trade type and status |
| **Sites Table** | Columns: Business name, subdomain, trade type, status badge, actions |
| **Status Badges** | Published (green), Draft (yellow), Trial (blue) |
| **Actions** | View details, edit, delete, preview, impersonate |
| **Create Site Dialog** | Manual site creation form (business name, subdomain, trade type, plan) |
| **Edit Site Dialog** | Edit site properties inline |
| **Delete Confirmation** | Alert dialog with destructive action confirmation |

#### Site Detail (`/admin/sites/:id`)

| Tab | Contents |
|-----|----------|
| **Overview** | Business name, subdomain, custom domain, trade type, style, contact info, services list, certifications, USPs, subscription/trial info |
| **Leads** | Table of all leads (name, email, phone, message, date) |
| **Pages** | List of all CMS pages (slug, title, last updated) |
| **Users** | Tenant users associated with this site (email, role) |
| **Photos** | Grid of uploaded site photos by type (logo, team, project, before, after, hero, service) |
| **Onboarding** | Current phase, completed phases checklist, collected data summary |

| Action | Description |
|--------|-------------|
| **Impersonate** | Log into the tenant admin panel as this site's admin |
| **External Link** | Open the public site in a new tab |
| **Back** | Return to sites list |

#### Users (`/admin/users`)

| Element | Description |
|---------|-------------|
| **Users Table** | All platform users with email, role, status |
| **Create User** | Form to add new platform admin users |

#### Revenue (`/admin/revenue`)

| Element | Description |
|---------|-------------|
| **MRR Card** | Monthly Recurring Revenue from Stripe |
| **Active Subscriptions** | Count of active, trialing, past due, canceled |
| **Customer Count** | Total Stripe customers |
| **Conversion Rate** | Free-to-paid conversion percentage |
| **Revenue Chart** | Monthly revenue trend (12-month view) |
| **Recent Payments** | Table of latest payments (amount, customer, date, status) |
| **Subscription Breakdown** | Table showing plan/trial phase distribution |

---

### 5.3 Tenant Admin Panel (`admin.theirbusiness.com`)

Access: Email/password auth on the tenant's custom subdomain.

#### Login (`/login` on tenant domain)

| Element | Description |
|---------|-------------|
| **Login Form** | Email and password fields |
| **Auth Scope** | Tenant-specific, validates against tenant_users table |
| **Session** | Cookie-based session management |

#### Dashboard (`/`)

| Element | Description |
|---------|-------------|
| **Site Status** | Published/Draft badge with publish toggle |
| **Public URL** | Clickable link to the live site with copy button |
| **Lead Stats** | Total leads, this month, new (unread) |
| **Quick Actions** | Edit Pages, View Leads, Settings, View Site |
| **Onboarding Progress** | Progress bar if onboarding is incomplete |
| **Subscription Status** | Current plan, trial phase, upgrade CTA |

#### Pages (`/pages`)

| Element | Description |
|---------|-------------|
| **Pages List** | All site pages with slug, title, edit link |
| **Edit Button** | Navigate to page editor |

#### Page Editor (`/pages/:slug`)

| Element | Description |
|---------|-------------|
| **Content Editor** | Rich JSON content editing for individual page sections |
| **Save Action** | Persist changes to the pages table |
| **Preview** | Link to view the page on the public site |

#### Leads (`/leads`)

| Element | Description |
|---------|-------------|
| **Leads List** | All captured leads with name, email, phone, message, source, date |
| **Lead Cards** | Mobile-friendly card layout with contact actions |
| **Contact Actions** | Reply via email, call phone number |
| **Date Display** | Relative and absolute date formatting |

#### Settings (`/settings`)

| Element | Description |
|---------|-------------|
| **Business Info** | Business name, brand color picker |
| **Services** | Comma-separated services list editor |
| **Domain Setup** | Custom domain connection with DNS instructions (CNAME/A record), verification status |
| **Publish Toggle** | Publish or unpublish the site |
| **Save** | Persist all settings changes |

#### Users (`/users`)

| Element | Description |
|---------|-------------|
| **Team Members** | List of tenant users with email and role |
| **Add User** | Form to invite new team members |

#### Future Screens

| Screen | Description | Priority |
|--------|-------------|----------|
| **Analytics** | Traffic data, page views, visitor sources, lead conversion funnel | High |
| **Billing** | Current plan, payment history, upgrade/downgrade, cancel | High |
| **Testimonials** | Manage customer reviews (add, edit, toggle visibility) | Medium |
| **Service Pricing** | Configure prices for the quote calculator | Medium |
| **Chatbot Config** | Customize AI chatbot personality, FAQs, and lead capture prompts | Medium |
| **Photo Management** | Upload, organize, delete photos; manage before/after pairs | Medium |

---

### 5.4 Public Contractor Website (`theirbusiness.com`)

All sections are rendered as a single-page scrolling experience with section-based navigation.

#### Sticky Header

| Element | Description |
|---------|-------------|
| **Logo** | Business logo or text fallback |
| **Navigation** | Anchor links to page sections (Services, About, Gallery, Contact, etc.) |
| **CTA Button** | Primary action button (e.g., "Get Free Estimate") |
| **Mobile Menu** | Hamburger icon with slide-out navigation |

#### Hero Section

| Element | Description |
|---------|-------------|
| **Background** | Trade-specific hero image (electrician, plumber, roofer, etc.) with dark wash overlay |
| **Business Name** | Large heading |
| **Tagline** | AI-generated or user-provided tagline |
| **CTA Buttons** | Primary + secondary calls to action |
| **Trust Badge** | Quick trust indicator (e.g., "Licensed & Insured") |

#### Trust Badges Bar

| Badge | Example Content |
|-------|----------------|
| Years Experience | "15+ Years Experience" |
| Licensed/Insured | "Licensed & Insured" |
| Service Area | "Serving Greater Portland" |
| Free Estimates | "Free Estimates" |

#### Services Section

| Element | Description |
|---------|-------------|
| **Service Cards** | Grid of service offerings with icons, titles, unique descriptions |
| **Trade-Specific** | Services pre-populated from trade template, customized during onboarding |

#### About Section

| Element | Description |
|---------|-------------|
| **Business Story** | Owner's story and company history (AI-generated from onboarding) |
| **Team Info** | Team photos and descriptions |
| **Certifications** | Badges for licenses and certifications |

#### Project Gallery

| Element | Description |
|---------|-------------|
| **Filter Tabs** | All, Projects, Before & After, Team, Services |
| **Photo Grid** | Responsive grid of project photos with hover effects |
| **Lightbox** | Full-screen photo viewer with navigation arrows |
| **Photo Types** | logo, team, project, before, after, hero, service |

#### Before/After Slider

| Element | Description |
|---------|-------------|
| **Interactive Slider** | Draggable divider between before and after images |
| **Labels** | "Before" / "After" labels on each side |
| **Caption** | Optional project description |
| **Touch Support** | Full touch/drag support on mobile |

#### Testimonials Section

| Element | Description |
|---------|-------------|
| **Review Cards** | Customer name, location, star rating (1-5), review text, project type |
| **Visual** | Quote icons, star display |

#### Service Area Section

| Element | Description |
|---------|-------------|
| **Map Placeholder** | Visual map representation with pin icon |
| **Service Area Text** | Primary service area (e.g., "Greater Portland Metro Area") |
| **Cities List** | Badge list of individual cities served |

#### Quote Calculator

| Element | Description |
|---------|-------------|
| **Service Selector** | Dropdown of available services |
| **Project Size** | Small / Medium / Large project selector |
| **Urgency Level** | Regular (1-2 weeks) / Soon (3-5 days) / Emergency (24-48 hrs) |
| **Result** | Estimated price range (e.g., "$450 - $750") |
| **Lead Capture** | Name, email, phone fields to receive detailed quote |
| **Submission** | Creates a lead in the system |

#### Appointment Scheduler

| Element | Description |
|---------|-------------|
| **Date Picker** | Calendar component for selecting preferred date |
| **Time Slot** | Morning (8AM-12PM) / Afternoon (12PM-5PM) / Evening (5PM-8PM) |
| **Service Selection** | Dropdown of services to book |
| **Contact Info** | Name, email, phone, notes |
| **Submission** | Creates an appointment record and captures lead |

#### Contact Section

| Element | Description |
|---------|-------------|
| **Contact Form** | Name, email, phone, message fields with validation |
| **Business Info** | Phone number, email address, physical address |
| **Submission** | Creates a lead and sends email notification to contractor |

#### AI Chatbot

| Element | Description |
|---------|-------------|
| **Floating Widget** | Chat bubble icon in bottom-right corner |
| **Chat Window** | Expandable chat interface with message history |
| **AI Assistant** | 24/7 AI sales assistant powered by Claude |
| **Lead Qualification** | AI asks about project needs, timeline, budget |
| **Lead Capture** | Captures visitor name, email, phone during conversation |
| **Conversation Persistence** | Conversations stored per visitor session |

#### Footer

| Element | Description |
|---------|-------------|
| **Business Info** | Name, phone, email, address |
| **Quick Links** | Navigation to main sections |
| **Copyright** | Year and business name |

#### Mobile CTA Bar

| Element | Description |
|---------|-------------|
| **Position** | Sticky bottom bar, visible on mobile viewports only |
| **Actions** | Call (tel: link), Email (mailto: link), Book (scroll to scheduler) |
| **Design** | Three equal-width action buttons |

---

## 6. Complete User Flows

### Flow 1: New Contractor Sign Up to Site Live

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    CONTRACTOR SIGN UP FLOW                                │
│                                                                          │
│  Step 1    Step 2     Step 3      Step 4       Step 5       Step 6       │
│  ┌─────┐  ┌──────┐  ┌────────┐  ┌─────────┐  ┌────────┐  ┌─────────┐  │
│  │Land │  │Sign  │  │Account │  │AI       │  │Generate│  │Preview  │  │
│  │on   │─>│Up    │─>│Created │─>│Onboard- │─>│Website │─>│Site     │  │
│  │LB.co│  │Page  │  │+ Site  │  │ing Chat │  │with AI │  │         │  │
│  └─────┘  └──────┘  └────────┘  └─────────┘  └────────┘  └─────────┘  │
│                                       |                         |        │
│                                       v                         v        │
│                                  12 Phases:              ┌──────────┐   │
│                                  1. Welcome              │Tenant    │   │
│                                  2. Business Basics      │Admin     │   │
│                                  3. Trade Detection      │Panel     │   │
│                                  4. Services             └──────────┘   │
│                                  5. Story                      |        │
│                                  6. Differentiators            v        │
│                                  7. Service Area         ┌──────────┐   │
│                                  8. Style (picker)       │Phase 1:  │   │
│                                  9. Pages (selector)     │30-day    │   │
│                                  10. Photos (upload)     │trial on  │   │
│                                  11. Review              │subdomain │   │
│                                  12. Complete            └──────────┘   │
│                                                                |        │
│                                                                v        │
│                                                          ┌──────────┐   │
│                                                          │Phase 2:  │   │
│                                                          │Custom    │   │
│                                                          │domain +  │   │
│                                                          │CC = paid │   │
│                                                          └──────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Detailed Steps:**

1. Visitor lands on `localblue.co` landing page
2. Clicks "Get Started Free" CTA button
3. Navigates to Sign Up page
4. Enters email, password, business name
5. System: Account created, site created with auto-generated subdomain (`businessname.localblue.co`)
6. Redirected to Onboarding page
7. AI chat begins structured conversation through 12 phases:
   - **Welcome** — Greeting and overview of what to expect
   - **Business Basics** — Business name confirmation, years in business, team size
   - **Trade Detection** — AI identifies trade type from conversation, sets TradeLabel
   - **Services** — Specific services offered, specializations
   - **Story** — Owner background, why they started, company values
   - **Differentiators** — What makes them unique, certifications, guarantees
   - **Service Area** — Cities/regions served, radius
   - **Style** — StylePicker component appears; contractor selects visual style
   - **Pages** — PageSelector component appears; contractor chooses pages to include
   - **Photos** — PhotoUpload component appears; upload logo, team, project photos
   - **Review** — Summary of all collected information
   - **Complete** — Ready to generate
8. Clicks "Generate Website" — AI creates all page content using collected data
9. Redirected to Preview page — sees their fully generated site
10. Navigates to `admin.businessname.localblue.co` — logs in with credentials
11. **Phase 1 Trial (30 days):** Site live on `businessname.localblue.co`, no credit card required
12. **Phase 2:** Connects custom domain via Settings → Credit card required → 14 days free on custom domain → Billing starts

---

### Flow 2: Visitor to Lead Capture

```
┌──────────────────────────────────────────────────────────────────┐
│                    VISITOR LEAD CAPTURE FLOW                      │
│                                                                  │
│  Homeowner searches "plumber near me"                            │
│         |                                                        │
│         v                                                        │
│  Finds contractor's SEO-optimized site                           │
│         |                                                        │
│         v                                                        │
│  Views: Hero -> Services -> Gallery -> Testimonials              │
│         |                                                        │
│         v                                                        │
│  ┌──────┴──────────┬────────────────┬────────────────┐          │
│  v                 v                v                v           │
│  Option A:      Option B:       Option C:        Option D:      │
│  Contact Form   AI Chatbot      Quote Calc       Appointment    │
│  ┌──────────┐  ┌──────────┐   ┌──────────┐    ┌──────────┐    │
│  │Name      │  │Chat with │   │Select    │    │Pick date │    │
│  │Email     │  │AI 24/7   │   │service   │    │Pick time │    │
│  │Phone     │  │AI quals  │   │Set size  │    │Select    │    │
│  │Message   │  │needs     │   │Set       │    │service   │    │
│  └────┬─────┘  │Captures  │   │urgency   │    │Contact   │    │
│       |        │lead info │   │Get quote │    │info      │    │
│       |        └────┬─────┘   │Lead      │    └────┬─────┘    │
│       |             |         │captured  │         |           │
│       |             |         └────┬─────┘         |           │
│       v             v              v               v           │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              LEAD CAPTURED IN SYSTEM                  │      │
│  │  + Email notification sent to contractor              │      │
│  └──────────────────────────┬───────────────────────────┘      │
│                             v                                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │         Contractor sees lead in admin dashboard       │      │
│  │         Reviews and responds to lead                  │      │
│  └──────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────┘
```

---

### Flow 3: Tenant Admin Daily Management

```
Step 1:  Go to admin.theirbusiness.com
Step 2:  Log in with email/password
Step 3:  View dashboard: site status, today's leads, this month's stats
Step 4:  Review new leads, contact via email/phone
Step 5:  Edit a page (update content, descriptions)
Step 6:  Check settings, update service list
Step 7:  Log out
```

---

### Flow 4: Platform Admin Operations

```
Step 1:  Go to localblue.co, log in with Replit Auth
Step 2:  View platform dashboard: total sites, published/draft, users
Step 3:  Drill into specific site: view leads, onboarding progress, pages, photos
Step 4:  Impersonate tenant admin to troubleshoot issue
Step 5:  Check revenue dashboard: MRR, subscriptions, recent payments
Step 6:  Create new platform user if needed
```

---

## 7. Pricing & Subscription Model

### Pricing Tiers

| | Starter | Growth | Scale |
|---|---------|--------|-------|
| **Monthly Price** | $49/mo | $99/mo | $199/mo |
| **Annual Price** | $490/yr ($41/mo) | $990/yr ($82/mo) | $1,990/yr ($165/mo) |
| **Core Value** | Professional Presence | Lead Automation | Local Dominance |
| **Unlimited Leads** | Yes | Yes | Yes |
| **AI-Built Website** | Yes | Yes | Priority Build |
| **White-Label Admin** | Yes | Yes | Yes |
| **Custom Domain** | Yes | Yes | Yes |
| **Contact Forms** | Yes | Yes | Yes |
| **Appointment Requests** | Manual | Calendar Sync | Calendar Sync |
| **Project Gallery** | Yes | Yes | Yes |
| **SEO Optimization** | Yes | Yes | Yes |
| **AI Sales Chatbot 24/7** | -- | Yes | Yes |
| **Before/After Galleries** | -- | Yes | Yes |
| **Testimonials Management** | -- | Yes | Yes |
| **Instant Quote Calculator** | -- | -- | Yes |
| **Service Pricing Display** | -- | -- | Yes |
| **Multi-Service Pages** | -- | -- | Yes |
| **Service Area Maps** | -- | -- | Yes |
| **Admin Seats** | 1 | 3 | Unlimited |
| **Support** | Email | Priority Email | Phone + Dedicated CSM |

### The Graduated Trial Model

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: "TEST DRIVE" (30 Days)                                │
│  ─────────────────────────────────────────────────────────────  │
│  Domain:       yourbusiness.localblue.co                        │
│  Requirement:  No Credit Card                                   │
│  Goal:         See AI-generated site, explore admin panel       │
│  Psychology:   Zero risk entry. Feel the white-label admin.     │
└─────────────────────────────────────────────────────────────────┘
                              |
                              v
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: "PROFESSIONAL LAUNCH" (14 Days Free)                  │
│  ─────────────────────────────────────────────────────────────  │
│  Domain:       www.yourbusiness.com (Custom Domain)             │
│  Requirement:  Credit Card Required                             │
│  Logic:        Custom domain = serious commitment               │
│  Safety Net:   14 days free on custom domain before charge      │
└─────────────────────────────────────────────────────────────────┘
                              |
                              v
┌─────────────────────────────────────────────────────────────────┐
│  ACTIVE: Paying Customer                                        │
│  ─────────────────────────────────────────────────────────────  │
│  Billing:      Monthly or Annual (2 months free on annual)      │
│  Domain:       Custom domain with SSL                           │
│  Full access:  All features for their tier                      │
└─────────────────────────────────────────────────────────────────┘
```

### Annual Discount Strategy

- **2 Months Free:** Annual = 10 months pricing (e.g., Starter $490 vs $588 monthly)
- **Founding Partner Plan:** Early adopters get pricing locked for life
- Protects early customers from future price increases as CRM, payments, and other features are added

### Upgrade Triggers

| Transition | Trigger |
|------------|---------|
| Phase 1 to Phase 2 | Want custom domain (professional brand) |
| Starter to Growth | Want AI chatbot for 24/7 lead capture |
| Growth to Scale | Need quote calculator, multiple locations, or more team seats |

### Revenue Model (Month 12 Projections)

```
Monthly Trial Signups:          1,000
Phase 1 Completions:              400
Phase 2 Conversions (Paying):     200/month
Cumulative Paying Customers:    ~1,600

MRR Breakdown:
  Starter  (960 @ $49):        $47,040
  Growth   (480 @ $99):        $47,520
  Scale    (160 @ $199):       $31,840

Total MRR:                    $126,400
ARR Run Rate:                 $1.52M
Blended ARPU:                 $79/month
```

---

## 8. Supported Trade Types & Style System

### 8.1 Trade Types (Current: 7)

| Trade | Template ID | Default Services | Trust Badges | Icon |
|-------|-------------|-----------------|--------------|------|
| **General Contractor** | `general_contractor` | Home Remodeling, Kitchen Renovation, Bathroom Renovation, Room Additions, Basement Finishing, Deck & Patio, New Construction, Commercial Build-Outs | Licensed & Insured, Free Estimates, Satisfaction Guaranteed, Local Family Owned | Hammer |
| **Plumber** | `plumber` | Emergency Repairs, Drain Cleaning, Water Heater, Pipe Repair, Fixture Installation, Sewer Line, Leak Detection, Bathroom/Kitchen | 24/7 Emergency, Licensed & Insured, Upfront Pricing, Same-Day Service | Wrench |
| **Electrician** | `electrician` | Panel Upgrades, Outlet & Switch, Lighting, Ceiling Fans, Repairs, Surge Protection, EV Charger, Generator | Licensed & Insured, Same-Day Service, Upfront Pricing, Safety First | Zap |
| **Roofer** | `roofer` | Roof Replacement, Repair, Storm Damage, Inspections, Gutter Installation, Shingle Replacement, Metal Roofing, Flat Roof | Free Inspections, Storm Damage Experts, Manufacturer Warranties, Licensed & Insured | Home |
| **HVAC** | `hvac` | AC Installation, Heating Install, Repair & Maintenance, Duct Cleaning, Thermostat, Air Quality, Heat Pump, Emergency | 24/7 Emergency, Financing Available, Same-Day Service, Satisfaction Guaranteed | Thermometer |
| **Painter** | `painter` | Interior, Exterior, Cabinet Refinishing, Deck & Fence Staining, Wallpaper Removal, Drywall Repair, Color Consultation, Commercial | Free Color Consultation, Premium Paints, Clean & Professional, Satisfaction Guaranteed | Paintbrush |
| **Landscaper** | `landscaper` | Landscape Design, Lawn Care, Hardscape, Tree & Shrub, Irrigation, Outdoor Lighting, Mulching, Seasonal Cleanup | Free Design Consultation, Sustainable Practices, Weekly Maintenance, Licensed & Insured | Leaf |

Each trade template includes:
- Default services list
- Default certifications
- Trust badges
- Common FAQs (4 per trade)
- Hero taglines (4 per trade)
- Stock image keywords
- Trade-specific hero background image

**TradeLabel Field:** Preserves the user's specific description of their trade. For example, a user who identifies as a "Finish Carpenter" will be categorized under `general_contractor` for template purposes, but the TradeLabel stores "Finish Carpenter" for display on their site.

### 8.2 Future Trade Expansion

| Trade | Target Timeline |
|-------|----------------|
| Home Cleaning | Q3 2026 |
| Pest Control | Q3 2026 |
| Pool Services | Q3 2026 |
| Handyman | Q3 2026 |
| Moving Companies | Q4 2026 |
| Auto Repair | Q4 2026 |

### 8.3 Style System (4 Styles)

| Style | Description | Primary Color | Font (Heading / Body) | Button Style |
|-------|-------------|--------------|----------------------|-------------|
| **Professional & Clean** | Modern, trustworthy with clean lines | `#2563EB` (Blue) | Inter / Inter | Rounded |
| **Bold & Modern** | Strong, confident with striking contrasts | `#DC2626` (Red) | Oswald / Roboto | Square |
| **Warm & Friendly** | Approachable, welcoming for family businesses | `#059669` (Green) | Merriweather / Open Sans | Rounded |
| **Luxury & Elegant** | Sophisticated, premium positioning | `#7C3AED` (Purple) | Playfair Display / Lato | Pill |

Each style template defines:
- Primary, secondary, accent, background, and foreground colors
- Heading and body font families
- Border radius
- Button shape (rounded, square, pill)

---

## 9. AI & Automation Strategy

### 9.1 AI Onboarding (Current)

| Aspect | Detail |
|--------|--------|
| **Model** | Claude (Anthropic) via AI Integrations |
| **Duration** | 5-15 minute structured conversation |
| **Phases** | 12 sequential phases with progress tracking |
| **Data Extraction** | Business name, trade type, services, story, differentiators, service area, style preference, page selection |
| **Interactive Components** | StylePicker, PageSelector, PhotoUpload surface during relevant phases |
| **Output** | Structured JSON data used to generate all website content |

### 9.2 AI Content Generation (Current)

| Aspect | Detail |
|--------|--------|
| **Trigger** | "Generate Website" button after onboarding complete |
| **Input** | All onboarding data (business details, services, story, differentiators, etc.) |
| **Output** | Unique, varied content for every page section: hero taglines, service descriptions, about page narrative, FAQ answers |
| **Quality** | Content is trade-specific, location-aware, and tonally matched to the chosen style |

### 9.3 AI Sales Chatbot (Current)

| Aspect | Detail |
|--------|--------|
| **Availability** | 24/7 on public contractor websites (Growth and Scale tiers) |
| **Personality** | Friendly, professional sales assistant for the contractor's business |
| **Context** | Knows the contractor's services, service area, and business details |
| **Lead Qualification** | Asks about project type, timeline, budget, location |
| **Lead Capture** | Collects visitor name, email, phone during natural conversation |
| **Storage** | Conversations stored per visitor with lead capture flag |
| **Floating Widget** | Chat bubble in bottom-right corner, expandable chat window |

### 9.4 Future AI Capabilities

| Feature | Description | Timeline |
|---------|-------------|----------|
| **AI Lead Follow-up** | Automated email sequences based on lead source and project type | Q2 2026 |
| **AI Review Response** | Draft responses to Google/Yelp reviews matching contractor's tone | Q2 2026 |
| **AI SEO Optimization** | Continuous content optimization based on search performance | Q3 2026 |
| **AI Voice Assistant** | Phone-based AI assistant for after-hours calls | Q4 2026 |
| **AI Content Refresh** | Periodic content updates to keep sites fresh and SEO-optimized | Q3 2026 |

---

## 10. SEO & Discoverability

### Current Implementation

| Feature | Implementation |
|---------|---------------|
| **Dynamic Title Tags** | `{Business Name} - {Trade} | {Service Area}` |
| **Meta Descriptions** | AI-generated, trade and location specific |
| **Open Graph Tags** | Title, description, image for social sharing |
| **Twitter Cards** | Summary card with large image |
| **JSON-LD Structured Data** | `LocalBusiness` schema with name, address, phone, services, area served |
| **Mobile-First Design** | 100% responsive, 400px+ viewport support |
| **Fast Loading** | Performance-optimized rendering |
| **Semantic HTML** | Proper heading hierarchy, landmark elements |
| **Alt Text** | Descriptive alt text on all images |

### SEO Hook: `useSeo`

The platform includes a custom React hook (`useSeo`) that dynamically sets:
- `<title>` tag
- `<meta name="description">` tag
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:type`)
- Twitter Card tags
- JSON-LD structured data script

### Future SEO Features

| Feature | Description | Timeline |
|---------|-------------|----------|
| **Google Business Profile Integration** | Sync business info, hours, photos | Q2 2026 |
| **Google Ads Integration** | Managed ad campaigns for contractors | Q2 2026 |
| **Local Citation Management** | Automated directory listings (Yelp, BBB, etc.) | Q3 2026 |
| **Sitemap Generation** | Automatic XML sitemaps | Q2 2026 |
| **Blog SEO** | Optimized blog posts with keyword targeting | Q3 2026 |

---

## 11. Interactive Components Deep Dive

### 11.1 ChatBot (`ChatBot.tsx`)

| Property | Detail |
|----------|--------|
| **Trigger** | Floating chat bubble icon (bottom-right) |
| **State** | Open/closed toggle, message history, loading states |
| **Visitor ID** | Auto-generated and persisted in localStorage |
| **Messages** | Role (user/assistant), content, timestamp |
| **AI Context** | Business name, services, service area, trade type |
| **Lead Capture** | AI naturally collects name, email, phone during conversation |
| **API** | `POST /api/public/:siteId/chat` with visitor ID and message history |
| **Persistence** | Conversations stored in `chatbot_conversations` table |
| **Availability** | Growth and Scale tiers only |

### 11.2 QuoteCalculator (`QuoteCalculator.tsx`)

| Property | Detail |
|----------|--------|
| **Inputs** | Service selector, project size (S/M/L), urgency (Regular/Soon/Emergency) |
| **Pricing Logic** | Base price per service x size multiplier (1/2/3.5) x urgency multiplier (1/1.25/1.75) |
| **Output** | Price range (calculated price - 20% to + 30%) |
| **Lead Capture** | Name, email, phone form after quote is displayed |
| **API** | `POST /api/public/:siteId/leads` to store the lead |
| **Availability** | Scale tier only |

### 11.3 AppointmentScheduler (`AppointmentScheduler.tsx`)

| Property | Detail |
|----------|--------|
| **Date Selection** | Calendar component, minimum date is today |
| **Time Slots** | Morning (8AM-12PM), Afternoon (12PM-5PM), Evening (5PM-8PM) |
| **Service Selection** | Dropdown populated from site's services list |
| **Contact Fields** | Name, email, phone, notes |
| **API** | `POST /api/public/:siteId/appointments` |
| **Status** | Appointments created with "pending" status |
| **Availability** | All tiers |

### 11.4 BeforeAfterSlider (`BeforeAfterSlider.tsx`)

| Property | Detail |
|----------|--------|
| **Interaction** | Draggable vertical divider between two images |
| **Position** | Percentage-based (0-100%), default 50% |
| **Labels** | "Before" on left, "After" on right |
| **Touch Support** | Full touch event handling for mobile |
| **Mouse Support** | Click and drag with mousedown/mousemove/mouseup |
| **Caption** | Optional text below the slider |
| **Availability** | Growth and Scale tiers |

### 11.5 ProjectGallery (`ProjectGallery.tsx`)

| Property | Detail |
|----------|--------|
| **Filter Tabs** | All, Projects, Before, After, Team, Services |
| **Photo Grid** | Responsive columns, hover effects |
| **Lightbox** | Full-screen modal with left/right navigation |
| **Photo Types** | `logo`, `team`, `project`, `before`, `after`, `hero`, `service` |
| **API** | `GET /api/public/:siteId/photos` |
| **Loading** | Skeleton placeholders while loading |
| **Availability** | All tiers |

### 11.6 ServiceAreaMap (`ServiceAreaMap.tsx`)

| Property | Detail |
|----------|--------|
| **Display** | Service area text with map pin icon |
| **Cities** | Badge list of individual cities/regions served |
| **Visual** | Map placeholder with branded styling |
| **Data Source** | `site.serviceArea` and parsed cities from onboarding |
| **Availability** | Scale tier only |

### 11.7 StylePicker (`StylePicker.tsx`)

| Property | Detail |
|----------|--------|
| **Context** | Appears during onboarding `style` phase |
| **Options** | 4 style cards (Professional, Bold, Warm, Luxury) |
| **Preview** | Each card shows color palette, font samples, button style |
| **Selection** | Ring highlight on selected style |
| **Output** | Sets `site.stylePreference` |

### 11.8 PageSelector (`PageSelector.tsx`)

| Property | Detail |
|----------|--------|
| **Context** | Appears during onboarding `pages` phase |
| **Options** | 12 page types: home, about, services, gallery, testimonials, faq, service-area, contact, quote, schedule, financing, blog |
| **Required** | Home, Services, and Contact are always included |
| **Icons** | Each page type has a dedicated Lucide icon |
| **Checkboxes** | Toggle individual pages on/off |
| **Output** | Sets `site.selectedPages` array |

### 11.9 OnboardingProgress (`OnboardingProgress.tsx`)

| Property | Detail |
|----------|--------|
| **Display** | Horizontal progress indicator |
| **Phases** | Visual steps: Welcome, Basics, Trade, Services, Story, Unique, Area, Style, Pages, Photos, Review |
| **States** | Completed (checkmark), current (highlighted), upcoming (dimmed) |
| **Responsive** | Abbreviated labels on mobile |

---

## 12. Product Roadmap Vision

### Q1 2026: Foundation (Now)

| Feature | Status |
|---------|--------|
| Core multi-tenant platform | Built |
| 7 trade templates with deep content | Built |
| AI-powered onboarding chat (12 phases) | Built |
| Lead generation widgets (chatbot, quote calc, scheduler, contact form) | Built |
| White-label tenant admin panel | Built |
| Platform admin panel with revenue dashboard | Built |
| Public contractor website rendering | Built |
| Photo upload and gallery system | Built |
| Before/after slider | Built |
| Custom domain connection (Cloudflare DNS) | Built |
| Stripe payment integration | Built |
| Email notifications (Resend) | Built |
| SEO (meta, OG, JSON-LD) | Built |
| Replit Auth for platform admin | Built |
| Analytics dashboard | In Progress |

### Q2 2026: Growth

| Feature | Priority |
|---------|----------|
| **AI-Powered Website Editor (Premium Tier)** | High |
| Multi-location support | High |
| Reputation management (review collection & display) | High |
| Google Ads integration | Medium |
| Mobile app for lead alerts (push notifications) | High |
| Reseller/agency program beta | Medium |
| Google Business Profile sync | Medium |
| Automated email follow-up sequences | High |
| Blog/content management | Medium |
| XML sitemap generation | Medium |

#### AI-Powered Website Editor (Premium Tier - Future)

**Vision:** A builder.io-style CMS with AI capabilities integrated directly into the tenant admin panel. Premium tier contractors will be able to visually edit their website with:

| Feature | Description |
|---------|-------------|
| **Drag-and-drop page builder** | Visual editor where contractors can rearrange sections, add new blocks, and customize layouts without any code |
| **AI content assistant** | Click any text block and ask AI to rewrite, expand, or optimize it for SEO and lead conversion |
| **Smart component library** | Pre-built sections (hero variants, testimonial layouts, service grids, CTA blocks) that the AI can customize to the contractor's trade and brand |
| **Real-time preview** | Live preview of changes across desktop, tablet, and mobile viewports |
| **AI layout suggestions** | Based on the contractor's trade type and highest-converting patterns across all LocalBlue sites, the AI suggests optimal page layouts |
| **Version history** | Undo/redo with full version history of all changes |
| **Template marketplace** | Premium contractors can browse and apply curated templates designed for their specific trade |

This feature represents the "Scale" plan's premium value proposition — turning LocalBlue from a website builder into a full AI-powered web presence management platform.

### Q3 2026: Expansion

| Feature | Priority |
|---------|----------|
| Additional home service verticals (cleaning, pest, pool, handyman) | High |
| Advanced CRM features (lead stages, pipeline view) | High |
| Automated follow-up sequences (AI-driven) | High |
| Integration marketplace (QuickBooks, ServiceTitan, etc.) | Medium |
| Enterprise features (SSO, audit logs, custom branding) | Low |
| AI content refresh (periodic SEO updates) | Medium |
| Local citation management | Medium |

### Q4 2026: Scale

| Feature | Priority |
|---------|----------|
| International expansion prep (UK, Canada, Australia) | Medium |
| Franchise / multi-unit management tools | Medium |
| AI voice assistant (after-hours phone AI) | High |
| Dispatch / scheduling integration | Medium |
| Strategic partnerships (supplier catalogs, tool companies) | Low |
| Additional verticals (moving, auto repair) | Medium |

### Long-Term Vision (2027+)

```
┌─────────────────────────────────────────────────────────────────┐
│              LOCALBLUE: FULL BUSINESS OPERATIONS SUITE            │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Website  │  │  Lead    │  │ Schedule │  │ Payments │       │
│  │ Builder  │  │  CRM     │  │ Dispatch │  │ Invoices │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Reviews  │  │ Marketing│  │ Customer │  │ AI Voice │       │
│  │ Reputa-  │  │ Automa-  │  │ Portal   │  │ Assistant│       │
│  │ tion     │  │ tion     │  │          │  │          │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                  │
│  All managed from admin.theirbusiness.com                        │
│  All powered by AI. All white-label.                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. Success Metrics

### North Star Metric

> **Active Leads Generated per Customer per Month**

This single metric captures both acquisition success (customers) and value delivery (leads). If customers are generating leads, they are seeing ROI and will retain.

### Funnel Metrics

| Stage | Metric | Target |
|-------|--------|--------|
| **Awareness** | Website visitors/month | 50,000 by Month 12 |
| **Interest** | Free signups/month | 1,000 by Month 12 |
| **Activation** | Site published within 7 days | 60% |
| **Revenue** | Free-to-paid conversion | 15%+ |
| **Retention** | Monthly churn rate | <5% |
| **Referral** | Customers who refer | 10% |

### Health Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **Time to First Site** | < 10 minutes | Activation speed = retention |
| **Lead Response Rate** | 24/7 via chatbot | Value delivery for the contractor |
| **Net Promoter Score** | > 50 | Customer satisfaction and advocacy |
| **Support Tickets/User** | < 0.5/month | Product quality and self-serve success |
| **Chatbot Adoption** | 70%+ of Growth/Scale users | Feature engagement and lead capture |
| **Onboarding Completion** | 80%+ | Ensuring users get to a generated site |

### Unit Economics

```
Average Revenue Per User (ARPU):     $79/month (blended across tiers)
Customer Acquisition Cost (CAC):     $150 (target)
Gross Margin:                        75% (AI costs factored)
LTV (24-month, 5% churn):           $1,343
LTV:CAC Ratio:                      8.9:1
Payback Period:                      1.9 months
```

---

## 14. Analytics & Lead Management Systems

### Site Analytics & Intelligent Optimization Engine

#### Current Implementation

| Feature | Description |
|---------|-------------|
| **Analytics Tracking** | Lightweight client-side tracking on all public contractor sites captures page views, visitor sessions, referral sources, device types, and time on page |
| **Analytics Dashboard** | Tenant admin dashboard showing traffic metrics (page views, unique visitors, session duration, bounce rate), traffic charts, top pages, referral sources, and device breakdown |
| **SEO Keyword Tracking** | Keyword data is stored and displayed with positions, impressions, clicks, and conversion rates; keyword discovery/ingestion requires manual entry or future Google Search Console integration |
| **AI-Powered Monthly Optimization** | Platform admin manually triggers AI analysis (not automated) that analyzes each site's traffic patterns, compares performance against cross-site averages for similar trades, generates specific improvements, and auto-applies safe changes (meta tags, page titles/descriptions) |
| **Cross-Site Learning** | Implemented in the AI optimization prompt (not a separate ML system) — it pulls cross-site averages for the same trade type to inform individual site improvement recommendations |

#### Data Models

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `analytics_events` | Individual page view and interaction tracking | siteId, visitorId, eventType, pageUrl, referrer, deviceType, timestamp |
| `analytics_daily` | Daily rolled-up metrics | siteId, date, pageViews, uniqueVisitors, avgSessionDuration, bounceRate |
| `seo_metrics` | SEO performance tracking | siteId, keyword, position, impressions, clicks, conversionRate, trackingDate |
| `seo_optimizations` | Applied SEO improvements | siteId, optimizationType (metaTag/title/description), appliedAt, impactMetric |

---

### Lead Management CRM

#### Current Implementation (Built)

| Feature | Description |
|---------|-------------|
| **Pipeline Stages** | Leads flow through structured stages: New → Contacted → Quoted → Won / Lost |
| **Priority System** | Low / Medium / High priority tagging for lead prioritization and follow-up urgency |
| **Source Tracking** | Automatically tags leads by origin: contact form, chatbot, quote calculator, appointment request |
| **Lead Notes & Activity** | Add notes (general note, call log, email log) to each lead for team collaboration and context |
| **Follow-up Reminders** | Set next follow-up dates with overdue highlighting and automated reminders |
| **Estimated Value** | Track estimated project value per lead for pipeline forecasting |
| **CRM Metrics** | Displays conversion rate, average response time, stage distribution, and total pipeline value |
| **Pipeline Visualization** | Visual funnel showing lead counts per stage and conversion rates |

#### Data Models

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `leads` | Lead records (extended with CRM fields) | siteId, name, email, phone, message, stage (new/contacted/quoted/won/lost), priority (low/medium/high), source (form/chatbot/quote/appointment), nextFollowUpAt, lastContactedAt, assignedTo, estimatedValue |
| `lead_notes` | Activity log and notes per lead | leadId, noteType (note/callLog/emailLog), content, createdBy, createdAt |

---

## Appendix A: Technical Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        LOCALBLUE ARCHITECTURE                         │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      FRONTEND (Vite + React)                 │    │
│  │  Landing | Signup | Onboarding | PublicSite | Admin Panels   │    │
│  │  Wouter routing | TanStack Query | Shadcn/ui | Tailwind     │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                             |                                        │
│  ┌──────────────────────────v──────────────────────────────────┐    │
│  │                    BACKEND (Express.js)                      │    │
│  │  API Routes | Tenant Middleware | Static Serving             │    │
│  └──────┬──────────┬──────────┬──────────┬────────────────────┘    │
│         |          |          |          |                           │
│  ┌──────v───┐ ┌────v───┐ ┌───v────┐ ┌──v──────┐ ┌────────────┐   │
│  │PostgreSQL│ │Anthropic│ │ Stripe │ │ Resend  │ │ Cloudflare │   │
│  │ (Neon)   │ │   AI    │ │Billing │ │  Email  │ │    DNS     │   │
│  └──────────┘ └────────┘ └────────┘ └─────────┘ └────────────┘   │
│                                                                      │
│  Key Tables:                                                         │
│  sites | tenant_users | pages | leads | onboarding_progress          │
│  site_photos | testimonials | service_pricing | appointments         │
│  chatbot_conversations | conversations | messages                    │
│  users (platform) | sessions (platform)                              │
└──────────────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy Model

| Concept | Implementation |
|---------|---------------|
| **Tenant Identification** | Subdomain-based routing (`admin.businessname.localblue.co` or `admin.customdomain.com`) |
| **Tenant Middleware** | Express middleware extracts tenant from hostname, loads site context |
| **Data Isolation** | All tenant data keyed by `siteId` foreign key |
| **Auth Separation** | Platform admin uses Replit Auth (OIDC); Tenant admin uses email/password with cookie sessions |
| **Domain Routing** | Cloudflare DNS manages custom domain CNAME records pointing to platform |

---

## Appendix B: Competitive Feature Matrix

| Feature | LocalBlue | Squarespace | Wix | Agency |
|---------|-----------|-------------|-----|--------|
| AI content generation | Yes | No | Partial | No |
| Trade-specific templates | Yes | No | No | Yes |
| White-label admin | Yes | No | No | Yes |
| AI chatbot (24/7) | Yes | No | No | Extra cost |
| Quote calculator | Yes | No | No | Extra cost |
| Appointment booking | Yes | Extra cost | Extra cost | Yes |
| Local SEO built-in | Yes | Partial | Partial | Yes |
| Time to launch | 5 min | 4-8 hours | 2-6 hours | 4-8 weeks |
| Monthly cost | $49-199 | $16-49 | $16-45 | $100-500 |
| Unlimited leads | Yes | No (caps) | No (caps) | Yes |

---

## Appendix C: Data Model Reference

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `sites` | Contractor website configuration | subdomain, customDomain, businessName, tradeType, stylePreference, subscriptionPlan, trialPhase, stripeCustomerId |
| `tenant_users` | Contractor admin accounts | email, password (hashed), siteId |
| `pages` | CMS content per site | siteId, slug, title, content (JSON) |
| `leads` | Contact form submissions | siteId, name, email, phone, message |
| `onboarding_progress` | AI onboarding state tracking | siteId, currentPhase, completedPhases, collectedData |
| `site_photos` | Uploaded images | siteId, type (logo/team/project/before/after/hero/service), url, caption |
| `testimonials` | Customer reviews | siteId, customerName, rating, content, projectType |
| `service_pricing` | Quote calculator configuration | siteId, serviceName, basePrice, priceUnit |
| `appointments` | Scheduled appointments | siteId, customerName, requestedDate, requestedTime, serviceType, status |
| `chatbot_conversations` | AI chatbot sessions | siteId, visitorId, messages (JSON), leadCaptured, leadName/Email/Phone |
| `users` | Platform admin accounts (Replit Auth) | id, username, email |
| `sessions` | Platform admin sessions | sid, userId, expiresAt |

### Available Page Types

| Page ID | Name | Required | Description |
|---------|------|----------|-------------|
| `home` | Home | Yes | Main landing page with hero section |
| `about` | About Us | No | Business story and team |
| `services` | Services | Yes | Detailed service offerings |
| `gallery` | Project Gallery | No | Photo showcase |
| `testimonials` | Testimonials | No | Customer reviews |
| `faq` | FAQ | No | Common questions |
| `service-area` | Service Area | No | Map and cities served |
| `contact` | Contact | Yes | Contact form and info |
| `quote` | Get a Quote | No | Online quote calculator |
| `schedule` | Schedule Service | No | Appointment booking |
| `financing` | Financing | No | Payment options info |
| `blog` | Blog | No | Articles and tips |

---

*This document is the single source of truth for LocalBlue's product vision, current state, and future direction. It should be updated as features are shipped and the product evolves.*

*Last updated: February 2026*
