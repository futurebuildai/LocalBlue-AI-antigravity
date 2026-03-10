import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, jsonb, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// Trade types for contractors
export const TRADE_TYPES = [
  "general_contractor",
  "plumber",
  "electrician",
  "roofer",
  "hvac",
  "painter",
  "landscaper",
] as const;
export type TradeType = typeof TRADE_TYPES[number];

// Style preferences for generated sites
export const STYLE_PREFERENCES = [
  "professional",
  "bold",
  "warm",
  "luxury",
] as const;
export type StylePreference = typeof STYLE_PREFERENCES[number];

// Subscription plans
export const SUBSCRIPTION_PLANS = [
  "starter",
  "growth",
  "scale",
] as const;
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[number];

// Trial phases for graduated trial model
export const TRIAL_PHASES = [
  "test_drive",      // 30-day trial on localblue.co subdomain, no credit card
  "professional_launch", // 14-day trial on custom domain, credit card required
  "active",          // Paying customer
  "expired",         // Trial expired without conversion
] as const;
export type TrialPhase = typeof TRIAL_PHASES[number];

// Onboarding phases
export const ONBOARDING_PHASES = [
  "welcome",
  "business_basics",
  "trade_detection",
  "services",
  "story",
  "differentiators",
  "service_area",
  "style",
  "pages",
  "photos",
  "review",
  "complete",
] as const;
export type OnboardingPhase = typeof ONBOARDING_PHASES[number];

// Tenant user roles
export const TENANT_USER_ROLES = [
  "owner",
  "admin",
  "editor",
  "viewer",
] as const;
export type TenantUserRole = typeof TENANT_USER_ROLES[number];

export const tenantUsers = pgTable("tenant_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  siteId: varchar("site_id").references(() => sites.id),
  role: text("role").$type<TenantUserRole>().notNull().default("editor"),
});

export const sites = pgTable("sites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subdomain: text("subdomain").notNull().unique(),
  customDomain: text("custom_domain"),
  businessName: text("business_name").notNull(),
  brandColor: text("brand_color").notNull().default("#3B82F6"),
  services: jsonb("services").$type<string[]>().default([]),
  isPublished: boolean("is_published").notNull().default(false),

  // Subscription & billing fields
  subscriptionPlan: text("subscription_plan").$type<SubscriptionPlan>().default("growth"),
  trialPhase: text("trial_phase").$type<TrialPhase>().default("test_drive"),
  trialStartDate: timestamp("trial_start_date").default(sql`CURRENT_TIMESTAMP`),
  trialEndDate: timestamp("trial_end_date"),
  hasCreditCard: boolean("has_credit_card").notNull().default(false),
  billingPeriod: text("billing_period").$type<"monthly" | "annual">().default("monthly"),

  // Stripe integration fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),

  // Enhanced fields for spectacular sites
  tradeType: text("trade_type").$type<TradeType>(),
  stylePreference: text("style_preference").$type<StylePreference>().default("professional"),
  selectedPages: jsonb("selected_pages").$type<string[]>().default([]),

  // Business details collected during onboarding
  tagline: text("tagline"),
  businessDescription: text("business_description"),
  serviceArea: text("service_area"),
  yearsInBusiness: integer("years_in_business"),
  totalYearsExperience: integer("total_years_experience"),
  projectsPerYear: integer("projects_per_year"),
  ownerName: text("owner_name"),
  ownerStory: text("owner_story"),
  uniqueSellingPoints: jsonb("unique_selling_points").$type<string[]>().default([]),
  certifications: jsonb("certifications").$type<string[]>().default([]),

  // Contact info
  phone: text("phone"),
  email: text("contact_email"),
  address: text("address"),

  // AI chatbot settings
  enableChatbot: boolean("enable_chatbot").notNull().default(true),
  chatbotFaqs: jsonb("chatbot_faqs").$type<Array<{ question: string, answer: string }>>().default([]),

  // Interactive elements toggles
  enableQuoteCalculator: boolean("enable_quote_calculator").notNull().default(false),
  enableAppointmentScheduler: boolean("enable_appointment_scheduler").notNull().default(false),
  enableBeforeAfterGallery: boolean("enable_before_after_gallery").notNull().default(false),
  enableProjectGallery: boolean("enable_project_gallery").notNull().default(true),
  enableServiceAreaMap: boolean("enable_service_area_map").notNull().default(false),
});

export const tenantUsersRelations = relations(tenantUsers, ({ one }) => ({
  site: one(sites, {
    fields: [tenantUsers.siteId],
    references: [sites.id],
  }),
}));

export const sitesRelations = relations(sites, ({ many }) => ({
  tenantUsers: many(tenantUsers),
}));

export const insertTenantUserSchema = createInsertSchema(tenantUsers, {
  role: z.enum(TENANT_USER_ROLES).optional()
}).omit({
  id: true,
});

export const insertSiteSchema = createInsertSchema(sites).omit({
  id: true,
});

export type InsertTenantUser = z.infer<typeof insertTenantUserSchema>;
export type TenantUser = typeof tenantUsers.$inferSelect;
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type Site = typeof sites.$inferSelect;

// Chat/Onboarding models
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  siteId: varchar("site_id").references(() => sites.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Pages CMS model
export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  content: jsonb("content").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertPageSchema = createInsertSchema(pages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Page = typeof pages.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;

// Lead stages and priorities for CRM
export const LEAD_STAGES = [
  "new",
  "contacted",
  "quoted",
  "won",
  "lost",
] as const;
export type LeadStage = typeof LEAD_STAGES[number];

export const LEAD_PRIORITIES = [
  "low",
  "medium",
  "high",
] as const;
export type LeadPriority = typeof LEAD_PRIORITIES[number];

// Leads model for contact form submissions
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message"),
  stage: text("stage").$type<LeadStage>().notNull().default("new"),
  priority: text("priority").$type<LeadPriority>().notNull().default("medium"),
  source: text("source"),
  nextFollowUpAt: timestamp("next_follow_up_at"),
  lastContactedAt: timestamp("last_contacted_at"),
  assignedTo: varchar("assigned_to").references(() => tenantUsers.id),
  estimatedValue: integer("estimated_value"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

// Onboarding progress tracking
export const onboardingProgress = pgTable("onboarding_progress", {
  id: serial("id").primaryKey(),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }).unique(),
  currentPhase: text("current_phase").$type<OnboardingPhase>().notNull().default("welcome"),
  collectedData: jsonb("collected_data").$type<Record<string, any>>().default({}),
  completedPhases: jsonb("completed_phases").$type<OnboardingPhase[]>().default([]),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertOnboardingProgressSchema = createInsertSchema(onboardingProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type InsertOnboardingProgress = z.infer<typeof insertOnboardingProgressSchema>;

// Site photos uploaded during onboarding or later
export const PHOTO_TYPES = [
  "logo",
  "team",
  "project",
  "before",
  "after",
  "hero",
  "service",
] as const;
export type PhotoType = typeof PHOTO_TYPES[number];

export const sitePhotos = pgTable("site_photos", {
  id: serial("id").primaryKey(),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  type: text("type").$type<PhotoType>().notNull(),
  url: text("url").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertSitePhotoSchema = createInsertSchema(sitePhotos).omit({
  id: true,
  createdAt: true,
});

export type SitePhoto = typeof sitePhotos.$inferSelect;
export type InsertSitePhoto = z.infer<typeof insertSitePhotoSchema>;

// Testimonials for trust building
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  customerLocation: text("customer_location"),
  rating: integer("rating").notNull().default(5),
  content: text("content").notNull(),
  projectType: text("project_type"),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true,
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

// Quote calculator pricing configuration
export const servicePricing = pgTable("service_pricing", {
  id: serial("id").primaryKey(),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  serviceName: text("service_name").notNull(),
  basePrice: integer("base_price").notNull(),
  priceUnit: text("price_unit").notNull().default("per job"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertServicePricingSchema = createInsertSchema(servicePricing).omit({
  id: true,
  createdAt: true,
});

export type ServicePricing = typeof servicePricing.$inferSelect;
export type InsertServicePricing = z.infer<typeof insertServicePricingSchema>;

// Appointment slots for scheduling
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  requestedDate: text("requested_date").notNull(),
  requestedTime: text("requested_time").notNull(),
  serviceType: text("service_type"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

// Chat conversations for public AI chatbot
export const chatbotConversations = pgTable("chatbot_conversations", {
  id: serial("id").primaryKey(),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  visitorId: text("visitor_id").notNull(),
  messages: jsonb("messages").$type<Array<{ role: string, content: string, timestamp: string }>>().default([]),
  leadCaptured: boolean("lead_captured").notNull().default(false),
  leadName: text("lead_name"),
  leadEmail: text("lead_email"),
  leadPhone: text("lead_phone"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertChatbotConversationSchema = createInsertSchema(chatbotConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ChatbotConversation = typeof chatbotConversations.$inferSelect;
export type InsertChatbotConversation = z.infer<typeof insertChatbotConversationSchema>;

// Lead notes - CRM activity log
export const leadNotes = pgTable("lead_notes", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").references(() => tenantUsers.id),
  content: text("content").notNull(),
  type: text("type").notNull().default("note"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertLeadNoteSchema = createInsertSchema(leadNotes).omit({
  id: true,
  createdAt: true,
});

export type LeadNote = typeof leadNotes.$inferSelect;
export type InsertLeadNote = z.infer<typeof insertLeadNoteSchema>;

// Analytics events - raw page view events
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  page: text("page").notNull(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  deviceType: text("device_type"),
  country: text("country"),
  city: text("city"),
  duration: integer("duration"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

// Analytics daily - daily rollup aggregates
export const analyticsDaily = pgTable("analytics_daily", {
  id: serial("id").primaryKey(),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  pageViews: integer("page_views").notNull().default(0),
  uniqueVisitors: integer("unique_visitors").notNull().default(0),
  avgSessionDuration: integer("avg_session_duration").default(0),
  bounceRate: integer("bounce_rate").default(0),
  topPages: jsonb("top_pages").$type<Array<{ page: string, views: number }>>().default([]),
  topReferrers: jsonb("top_referrers").$type<Array<{ referrer: string, count: number }>>().default([]),
  deviceBreakdown: jsonb("device_breakdown").$type<{ desktop: number, mobile: number, tablet: number }>().default({ desktop: 0, mobile: 0, tablet: 0 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertAnalyticsDailySchema = createInsertSchema(analyticsDaily).omit({
  id: true,
  createdAt: true,
});

export type AnalyticsDaily = typeof analyticsDaily.$inferSelect;
export type InsertAnalyticsDaily = z.infer<typeof insertAnalyticsDailySchema>;

// SEO metrics - monthly tracking
export const seoMetrics = pgTable("seo_metrics", {
  id: serial("id").primaryKey(),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  month: text("month").notNull(),
  keywords: jsonb("keywords").$type<Array<{ keyword: string, position: number | null, impressions: number, clicks: number }>>().default([]),
  organicTraffic: integer("organic_traffic").default(0),
  totalLeads: integer("total_leads").default(0),
  conversionRate: integer("conversion_rate").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertSeoMetricSchema = createInsertSchema(seoMetrics).omit({
  id: true,
  createdAt: true,
});

export type SeoMetric = typeof seoMetrics.$inferSelect;
export type InsertSeoMetric = z.infer<typeof insertSeoMetricSchema>;

// SEO optimizations - AI optimization history
export const seoOptimizations = pgTable("seo_optimizations", {
  id: serial("id").primaryKey(),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  month: text("month").notNull(),
  type: text("type").notNull(),
  page: text("page"),
  description: text("description").notNull(),
  changesMade: jsonb("changes_made").$type<Record<string, any>>().default({}),
  impactMetrics: jsonb("impact_metrics").$type<{ leadsBefore?: number, leadsAfter?: number, trafficBefore?: number, trafficAfter?: number }>().default({}),
  status: text("status").notNull().default("applied"),
  crossSiteInsight: boolean("cross_site_insight").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertSeoOptimizationSchema = createInsertSchema(seoOptimizations).omit({
  id: true,
  createdAt: true,
});

export type SeoOptimization = typeof seoOptimizations.$inferSelect;
export type InsertSeoOptimization = z.infer<typeof insertSeoOptimizationSchema>;

// RFQ status values for integration with FB-Brain
export const RFQ_STATUSES = [
  "pending",
  "viewed",
  "bid_submitted",
  "accepted",
  "rejected",
] as const;
export type RfqStatus = typeof RFQ_STATUSES[number];

// Bid status values
export const BID_STATUSES = [
  "draft",
  "submitted",
  "accepted",
  "rejected",
] as const;
export type BidStatus = typeof BID_STATUSES[number];

// RFQs received from FB-Brain integration
export const rfqs = pgTable("rfqs", {
  id: serial("id").primaryKey(),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  externalRfqId: varchar("external_rfq_id").notNull(),
  builderName: text("builder_name").notNull(),
  projectName: text("project_name").notNull(),
  projectAddress: text("project_address"),
  phaseDescription: text("phase_description").notNull(),
  scopeItems: jsonb("scope_items").$type<Array<{ item: string; quantity: number; unit: string }>>().default([]),
  startDate: text("start_date"),
  status: text("status").$type<RfqStatus>().notNull().default("pending"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertRfqSchema = createInsertSchema(rfqs).omit({
  id: true,
  createdAt: true,
});

export type Rfq = typeof rfqs.$inferSelect;
export type InsertRfq = z.infer<typeof insertRfqSchema>;

// Bids submitted by the tenant in response to RFQs
export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  rfqId: integer("rfq_id").notNull().references(() => rfqs.id, { onDelete: "cascade" }),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  totalAmountCents: integer("total_amount_cents").notNull(),
  laborCostCents: integer("labor_cost_cents"),
  notes: text("notes"),
  lineItems: jsonb("line_items").$type<Array<{ description: string; amountCents: number }>>().default([]),
  estimatedDays: integer("estimated_days"),
  status: text("status").$type<BidStatus>().notNull().default("draft"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  createdAt: true,
});

export type Bid = typeof bids.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;

// Audit Logs for RBAC tracking
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  siteId: varchar("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => tenantUsers.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  details: jsonb("details").$type<Record<string, any>>().default({}),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
