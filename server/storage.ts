import {
  tenantUsers, sites, conversations, messages, pages, leads,
  onboardingProgress, sitePhotos, testimonials, servicePricing, appointments, chatbotConversations,
  leadNotes, analyticsEvents, analyticsDaily, seoMetrics, seoOptimizations,
  rfqs, bids, agentConfigs, agentExecutions, generatedContent,
  type TenantUser, type InsertTenantUser,
  type Site, type InsertSite,
  type Conversation, type Message,
  type Page, type InsertPage,
  type Lead, type InsertLead,
  type OnboardingProgress, type InsertOnboardingProgress,
  type SitePhoto, type InsertSitePhoto,
  type Testimonial, type InsertTestimonial,
  type ServicePricing, type InsertServicePricing,
  type Appointment, type InsertAppointment,
  type ChatbotConversation, type InsertChatbotConversation,
  type LeadNote, type InsertLeadNote,
  type AnalyticsEvent, type InsertAnalyticsEvent,
  type AnalyticsDaily, type InsertAnalyticsDaily,
  type SeoMetric, type InsertSeoMetric,
  type SeoOptimization, type InsertSeoOptimization,
  type Rfq, type InsertRfq,
  type Bid, type InsertBid,
  type RfqStatus, type BidStatus,
  type AgentConfig, type InsertAgentConfig,
  type AgentExecution, type InsertAgentExecution,
  type AgentType, type AgentExecutionStatus,
  type GeneratedContent, type InsertGeneratedContent,
  type ContentReviewStatus,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, lt, sql } from "drizzle-orm";

export interface IStorage {
  // Tenant User operations
  getTenantUser(id: string): Promise<TenantUser | undefined>;
  getTenantUserByEmail(email: string): Promise<TenantUser | undefined>;
  createTenantUser(user: InsertTenantUser): Promise<TenantUser>;
  updateTenantUser(id: string, user: Partial<InsertTenantUser>): Promise<TenantUser | undefined>;
  deleteTenantUser(id: string): Promise<boolean>;
  getTenantUsersBySiteId(siteId: string): Promise<TenantUser[]>;
  getAllTenantUsers(): Promise<TenantUser[]>;

  // Site operations
  getSite(id: string): Promise<Site | undefined>;
  getSiteBySubdomain(subdomain: string): Promise<Site | undefined>;
  getSiteByCustomDomain(customDomain: string): Promise<Site | undefined>;
  getAllSites(): Promise<Site[]>;
  createSite(site: InsertSite): Promise<Site>;
  updateSite(id: string, site: Partial<InsertSite>): Promise<Site | undefined>;
  deleteSite(id: string): Promise<boolean>;

  // Conversation operations
  getConversationBySiteId(siteId: string): Promise<Conversation | undefined>;
  createConversation(title: string, siteId: string): Promise<Conversation>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;

  // Page operations
  getPageBySiteAndSlug(siteId: string, slug: string): Promise<Page | undefined>;
  getPagesBySiteId(siteId: string): Promise<Page[]>;
  createPage(page: InsertPage): Promise<Page>;
  updatePage(id: number, page: Partial<InsertPage>): Promise<Page | undefined>;

  // Lead operations
  createLead(lead: InsertLead): Promise<Lead>;
  getLeadsBySiteId(siteId: string): Promise<Lead[]>;

  // Onboarding progress operations
  getOnboardingProgress(siteId: string): Promise<OnboardingProgress | undefined>;
  createOnboardingProgress(progress: InsertOnboardingProgress): Promise<OnboardingProgress>;
  updateOnboardingProgress(siteId: string, progress: Partial<InsertOnboardingProgress>): Promise<OnboardingProgress | undefined>;

  // Site photo operations
  getSitePhotos(siteId: string): Promise<SitePhoto[]>;
  getSitePhotosByType(siteId: string, type: string): Promise<SitePhoto[]>;
  createSitePhoto(photo: InsertSitePhoto): Promise<SitePhoto>;
  deleteSitePhoto(id: number): Promise<boolean>;

  // Testimonial operations
  getTestimonials(siteId: string): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  updateTestimonial(id: number, testimonial: Partial<InsertTestimonial>): Promise<Testimonial | undefined>;
  deleteTestimonial(id: number): Promise<boolean>;

  // Service pricing operations
  getServicePricing(siteId: string): Promise<ServicePricing[]>;
  createServicePricing(pricing: InsertServicePricing): Promise<ServicePricing>;
  updateServicePricing(id: number, pricing: Partial<InsertServicePricing>): Promise<ServicePricing | undefined>;
  deleteServicePricing(id: number): Promise<boolean>;

  // Appointment operations
  getAppointments(siteId: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined>;

  // Chatbot conversation operations
  getChatbotConversation(siteId: string, visitorId: string): Promise<ChatbotConversation | undefined>;
  getChatbotConversationsBySite(siteId: string): Promise<ChatbotConversation[]>;
  createChatbotConversation(conversation: InsertChatbotConversation): Promise<ChatbotConversation>;
  updateChatbotConversation(id: number, conversation: Partial<InsertChatbotConversation>): Promise<ChatbotConversation | undefined>;

  // Page content update operations
  updatePageContent(siteId: string, slug: string, content: Record<string, any>): Promise<Page | undefined>;

  // Lead CRM operations
  updateLead(id: number, data: Partial<InsertLead>): Promise<Lead | undefined>;
  getLeadById(id: number): Promise<Lead | undefined>;
  getLeadsBySiteIdWithFilters(siteId: string, filters?: { stage?: string; priority?: string }): Promise<Lead[]>;

  // Lead notes operations
  getLeadNotes(leadId: number): Promise<LeadNote[]>;
  createLeadNote(note: InsertLeadNote): Promise<LeadNote>;

  // Analytics operations
  createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getAnalyticsDailySummary(siteId: string, startDate: string, endDate: string): Promise<AnalyticsDaily[]>;
  upsertAnalyticsDaily(data: InsertAnalyticsDaily): Promise<AnalyticsDaily>;

  // SEO operations
  getSeoMetrics(siteId: string, month?: string): Promise<SeoMetric[]>;
  createSeoMetric(metric: InsertSeoMetric): Promise<SeoMetric>;
  getSeoOptimizations(siteId: string): Promise<SeoOptimization[]>;
  createSeoOptimization(optimization: InsertSeoOptimization): Promise<SeoOptimization>;

  // RFQ operations (FB-Brain integration)
  createRfq(rfq: InsertRfq): Promise<Rfq>;
  getRfqsBySite(siteId: string): Promise<Rfq[]>;
  getRfqById(id: number): Promise<Rfq | undefined>;
  updateRfqStatus(id: number, status: RfqStatus): Promise<Rfq | undefined>;

  // Bid operations (FB-Brain integration)
  createBid(bid: InsertBid): Promise<Bid>;
  getBidByRfq(rfqId: number): Promise<Bid | undefined>;
  updateBidStatus(id: number, status: BidStatus): Promise<Bid | undefined>;

  // Agent config operations
  getAgentConfigs(siteId: string): Promise<AgentConfig[]>;
  getAgentConfig(siteId: string, agentType: AgentType): Promise<AgentConfig | undefined>;
  upsertAgentConfig(config: InsertAgentConfig): Promise<AgentConfig>;

  // Agent execution operations
  createAgentExecution(execution: InsertAgentExecution): Promise<AgentExecution>;
  getAgentExecution(id: number): Promise<AgentExecution | undefined>;
  updateAgentExecution(id: number, data: Partial<AgentExecution>): Promise<AgentExecution | undefined>;
  getAgentExecutionsBySite(siteId: string, limit?: number): Promise<AgentExecution[]>;
  getPendingAgentExecutions(limit?: number): Promise<AgentExecution[]>;
  claimPendingExecution(): Promise<AgentExecution | null>;
  hasPendingOrRunningExecution(siteId: string, agentType: AgentType): Promise<boolean>;
  getOverdueScheduledConfigs(): Promise<AgentConfig[]>;
  getLeadsBySiteIdInDateRange(siteId: string, start: Date, end: Date): Promise<Lead[]>;
  cleanupOldExecutions(olderThanDays: number): Promise<number>;
  markStaleRunningExecutions(olderThanMs: number): Promise<number>;

  // Generated content operations
  createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent>;
  getGeneratedContentBySite(siteId: string, status?: ContentReviewStatus, limit?: number, cursor?: number): Promise<GeneratedContent[]>;
  getGeneratedContentById(id: number): Promise<GeneratedContent | undefined>;
  updateGeneratedContentStatus(id: number, status: ContentReviewStatus, reviewedBy?: string): Promise<GeneratedContent | undefined>;

  // Transactional content approval — atomically approve + apply content to page
  approveAndApplyContent(id: number, siteId: string, reviewedBy?: string): Promise<{ content: GeneratedContent; applied: boolean }>;

  // Cursor-based pagination for executions
  getAgentExecutionsBySitePaginated(siteId: string, limit: number, cursor?: number): Promise<AgentExecution[]>;
}

export class DatabaseStorage implements IStorage {
  // Tenant User operations
  async getTenantUser(id: string): Promise<TenantUser | undefined> {
    const [user] = await db.select().from(tenantUsers).where(eq(tenantUsers.id, id));
    return user || undefined;
  }

  async getTenantUserByEmail(email: string): Promise<TenantUser | undefined> {
    const [user] = await db.select().from(tenantUsers).where(eq(tenantUsers.email, email));
    return user || undefined;
  }

  async createTenantUser(insertUser: InsertTenantUser): Promise<TenantUser> {
    const [user] = await db.insert(tenantUsers).values(insertUser).returning();
    return user;
  }

  async updateTenantUser(id: string, userData: Partial<InsertTenantUser>): Promise<TenantUser | undefined> {
    const [user] = await db.update(tenantUsers).set(userData).where(eq(tenantUsers.id, id)).returning();
    return user || undefined;
  }

  async deleteTenantUser(id: string): Promise<boolean> {
    const result = await db.delete(tenantUsers).where(eq(tenantUsers.id, id)).returning();
    return result.length > 0;
  }

  async getTenantUsersBySiteId(siteId: string): Promise<TenantUser[]> {
    return db.select().from(tenantUsers).where(eq(tenantUsers.siteId, siteId));
  }

  async getAllTenantUsers(): Promise<TenantUser[]> {
    return db.select().from(tenantUsers);
  }

  // Site operations
  async getSite(id: string): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.id, id));
    return site || undefined;
  }

  async getSiteBySubdomain(subdomain: string): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.subdomain, subdomain));
    return site || undefined;
  }

  async getSiteByCustomDomain(customDomain: string): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.customDomain, customDomain));
    return site || undefined;
  }

  async getAllSites(): Promise<Site[]> {
    return db.select().from(sites);
  }

  async createSite(insertSite: InsertSite): Promise<Site> {
    const [site] = await db.insert(sites).values({
      ...insertSite,
      services: insertSite.services as string[] | undefined,
    } as any).returning();
    return site;
  }

  async updateSite(id: string, siteData: Partial<InsertSite>): Promise<Site | undefined> {
    const updateData = {
      ...siteData,
      services: siteData.services as string[] | undefined,
    };
    const [site] = await db.update(sites).set(updateData as any).where(eq(sites.id, id)).returning();
    return site || undefined;
  }

  async deleteSite(id: string): Promise<boolean> {
    const result = await db.delete(sites).where(eq(sites.id, id)).returning();
    return result.length > 0;
  }

  // Conversation operations
  async getConversationBySiteId(siteId: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.siteId, siteId)).orderBy(desc(conversations.createdAt));
    return conversation || undefined;
  }

  async createConversation(title: string, siteId: string): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values({ title, siteId }).returning();
    return conversation;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(conversationId: number, role: string, content: string): Promise<Message> {
    const [message] = await db.insert(messages).values({ conversationId, role, content }).returning();
    return message;
  }

  // Page operations
  async getPageBySiteAndSlug(siteId: string, slug: string): Promise<Page | undefined> {
    const [page] = await db.select().from(pages).where(and(eq(pages.siteId, siteId), eq(pages.slug, slug)));
    return page || undefined;
  }

  async getPagesBySiteId(siteId: string): Promise<Page[]> {
    return db.select().from(pages).where(eq(pages.siteId, siteId));
  }

  async createPage(insertPage: InsertPage): Promise<Page> {
    const [page] = await db.insert(pages).values({
      ...insertPage,
      content: insertPage.content as Record<string, any> | undefined,
    }).returning();
    return page;
  }

  async updatePage(id: number, pageData: Partial<InsertPage>): Promise<Page | undefined> {
    const updateData = {
      ...pageData,
      content: pageData.content as Record<string, any> | undefined,
      updatedAt: new Date(),
    };
    const [page] = await db.update(pages).set(updateData).where(eq(pages.id, id)).returning();
    return page || undefined;
  }

  // Page content update operations
  async updatePageContent(siteId: string, slug: string, content: Record<string, any>): Promise<Page | undefined> {
    const existingPage = await this.getPageBySiteAndSlug(siteId, slug);
    if (!existingPage) return undefined;
    const mergedContent = { ...(existingPage.content as Record<string, any> || {}), ...content };
    const [page] = await db.update(pages).set({
      content: mergedContent,
      updatedAt: new Date(),
    }).where(eq(pages.id, existingPage.id)).returning();
    return page || undefined;
  }

  // Lead operations
  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(insertLead as any).returning();
    return lead;
  }

  async getLeadsBySiteId(siteId: string): Promise<Lead[]> {
    return db.select().from(leads).where(eq(leads.siteId, siteId)).orderBy(desc(leads.createdAt));
  }

  // Onboarding progress operations
  async getOnboardingProgress(siteId: string): Promise<OnboardingProgress | undefined> {
    const [progress] = await db.select().from(onboardingProgress).where(eq(onboardingProgress.siteId, siteId));
    return progress || undefined;
  }

  async createOnboardingProgress(progress: InsertOnboardingProgress): Promise<OnboardingProgress> {
    const [created] = await db.insert(onboardingProgress).values(progress as any).returning();
    return created;
  }

  async updateOnboardingProgress(siteId: string, progressData: Partial<InsertOnboardingProgress>): Promise<OnboardingProgress | undefined> {
    const [updated] = await db.update(onboardingProgress)
      .set({ ...progressData, updatedAt: new Date() } as any)
      .where(eq(onboardingProgress.siteId, siteId))
      .returning();
    return updated || undefined;
  }

  // Site photo operations
  async getSitePhotos(siteId: string): Promise<SitePhoto[]> {
    return db.select().from(sitePhotos).where(eq(sitePhotos.siteId, siteId)).orderBy(sitePhotos.sortOrder);
  }

  async getSitePhotosByType(siteId: string, type: string): Promise<SitePhoto[]> {
    return db.select().from(sitePhotos)
      .where(and(eq(sitePhotos.siteId, siteId), eq(sitePhotos.type, type as any)))
      .orderBy(sitePhotos.sortOrder);
  }

  async createSitePhoto(photo: InsertSitePhoto): Promise<SitePhoto> {
    const [created] = await db.insert(sitePhotos).values(photo as any).returning();
    return created;
  }

  async deleteSitePhoto(id: number): Promise<boolean> {
    const result = await db.delete(sitePhotos).where(eq(sitePhotos.id, id)).returning();
    return result.length > 0;
  }

  // Testimonial operations
  async getTestimonials(siteId: string): Promise<Testimonial[]> {
    return db.select().from(testimonials)
      .where(and(eq(testimonials.siteId, siteId), eq(testimonials.isVisible, true)))
      .orderBy(desc(testimonials.createdAt));
  }

  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const [created] = await db.insert(testimonials).values(testimonial).returning();
    return created;
  }

  async updateTestimonial(id: number, testimonialData: Partial<InsertTestimonial>): Promise<Testimonial | undefined> {
    const [updated] = await db.update(testimonials).set(testimonialData).where(eq(testimonials.id, id)).returning();
    return updated || undefined;
  }

  async deleteTestimonial(id: number): Promise<boolean> {
    const result = await db.delete(testimonials).where(eq(testimonials.id, id)).returning();
    return result.length > 0;
  }

  // Service pricing operations
  async getServicePricing(siteId: string): Promise<ServicePricing[]> {
    return db.select().from(servicePricing)
      .where(and(eq(servicePricing.siteId, siteId), eq(servicePricing.isActive, true)));
  }

  async createServicePricing(pricing: InsertServicePricing): Promise<ServicePricing> {
    const [created] = await db.insert(servicePricing).values(pricing).returning();
    return created;
  }

  async updateServicePricing(id: number, pricingData: Partial<InsertServicePricing>): Promise<ServicePricing | undefined> {
    const [updated] = await db.update(servicePricing).set(pricingData).where(eq(servicePricing.id, id)).returning();
    return updated || undefined;
  }

  async deleteServicePricing(id: number): Promise<boolean> {
    const result = await db.delete(servicePricing).where(eq(servicePricing.id, id)).returning();
    return result.length > 0;
  }

  // Appointment operations
  async getAppointments(siteId: string): Promise<Appointment[]> {
    return db.select().from(appointments).where(eq(appointments.siteId, siteId)).orderBy(desc(appointments.createdAt));
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [created] = await db.insert(appointments).values(appointment).returning();
    return created;
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined> {
    const [updated] = await db.update(appointments).set({ status }).where(eq(appointments.id, id)).returning();
    return updated || undefined;
  }

  // Chatbot conversation operations
  async getChatbotConversation(siteId: string, visitorId: string): Promise<ChatbotConversation | undefined> {
    const [conversation] = await db.select().from(chatbotConversations)
      .where(and(eq(chatbotConversations.siteId, siteId), eq(chatbotConversations.visitorId, visitorId)));
    return conversation || undefined;
  }

  async getChatbotConversationsBySite(siteId: string): Promise<ChatbotConversation[]> {
    return db.select().from(chatbotConversations)
      .where(eq(chatbotConversations.siteId, siteId))
      .orderBy(desc(chatbotConversations.createdAt));
  }

  async createChatbotConversation(conversation: InsertChatbotConversation): Promise<ChatbotConversation> {
    const [created] = await db.insert(chatbotConversations).values(conversation).returning();
    return created;
  }

  async updateChatbotConversation(id: number, conversationData: Partial<InsertChatbotConversation>): Promise<ChatbotConversation | undefined> {
    const [updated] = await db.update(chatbotConversations)
      .set({ ...conversationData, updatedAt: new Date() })
      .where(eq(chatbotConversations.id, id))
      .returning();
    return updated || undefined;
  }

  // Lead CRM operations
  async updateLead(id: number, data: Partial<InsertLead>): Promise<Lead | undefined> {
    const [updated] = await db.update(leads).set(data as any).where(eq(leads.id, id)).returning();
    return updated || undefined;
  }

  async getLeadById(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async getLeadsBySiteIdWithFilters(siteId: string, filters?: { stage?: string; priority?: string }): Promise<Lead[]> {
    const conditions = [eq(leads.siteId, siteId)];
    if (filters?.stage) {
      conditions.push(eq(leads.stage, filters.stage as import("@shared/schema").LeadStage));
    }
    if (filters?.priority) {
      conditions.push(eq(leads.priority, filters.priority as import("@shared/schema").LeadPriority));
    }
    return db.select().from(leads).where(and(...conditions)).orderBy(desc(leads.createdAt));
  }

  // Lead notes operations
  async getLeadNotes(leadId: number): Promise<LeadNote[]> {
    return db.select().from(leadNotes).where(eq(leadNotes.leadId, leadId)).orderBy(desc(leadNotes.createdAt));
  }

  async createLeadNote(note: InsertLeadNote): Promise<LeadNote> {
    const [created] = await db.insert(leadNotes).values(note).returning();
    return created;
  }

  // Analytics operations
  async createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [created] = await db.insert(analyticsEvents).values(event).returning();
    return created;
  }

  async getAnalyticsDailySummary(siteId: string, startDate: string, endDate: string): Promise<AnalyticsDaily[]> {
    return db.select().from(analyticsDaily)
      .where(and(
        eq(analyticsDaily.siteId, siteId),
        gte(analyticsDaily.date, startDate),
        lte(analyticsDaily.date, endDate)
      ))
      .orderBy(analyticsDaily.date);
  }

  async upsertAnalyticsDaily(data: InsertAnalyticsDaily): Promise<AnalyticsDaily> {
    const existing = await db.select().from(analyticsDaily)
      .where(and(eq(analyticsDaily.siteId, data.siteId), eq(analyticsDaily.date, data.date)));

    if (existing.length > 0) {
      const [updated] = await db.update(analyticsDaily)
        .set(data)
        .where(and(eq(analyticsDaily.siteId, data.siteId), eq(analyticsDaily.date, data.date)))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(analyticsDaily).values(data).returning();
      return created;
    }
  }

  // SEO operations
  async getSeoMetrics(siteId: string, month?: string): Promise<SeoMetric[]> {
    const conditions = [eq(seoMetrics.siteId, siteId)];
    if (month) {
      conditions.push(eq(seoMetrics.month, month));
    }
    return db.select().from(seoMetrics).where(and(...conditions)).orderBy(desc(seoMetrics.month));
  }

  async createSeoMetric(metric: InsertSeoMetric): Promise<SeoMetric> {
    const [created] = await db.insert(seoMetrics).values(metric).returning();
    return created;
  }

  async getSeoOptimizations(siteId: string): Promise<SeoOptimization[]> {
    return db.select().from(seoOptimizations)
      .where(eq(seoOptimizations.siteId, siteId))
      .orderBy(desc(seoOptimizations.createdAt));
  }

  async createSeoOptimization(optimization: InsertSeoOptimization): Promise<SeoOptimization> {
    const [created] = await db.insert(seoOptimizations).values(optimization).returning();
    return created;
  }

  // RFQ operations (FB-Brain integration)
  async createRfq(rfq: InsertRfq): Promise<Rfq> {
    const [created] = await db.insert(rfqs).values(rfq as any).returning();
    return created;
  }

  async getRfqsBySite(siteId: string): Promise<Rfq[]> {
    return db.select().from(rfqs).where(eq(rfqs.siteId, siteId)).orderBy(desc(rfqs.createdAt));
  }

  async getRfqById(id: number): Promise<Rfq | undefined> {
    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, id));
    return rfq || undefined;
  }

  async updateRfqStatus(id: number, status: RfqStatus): Promise<Rfq | undefined> {
    const [updated] = await db.update(rfqs).set({ status }).where(eq(rfqs.id, id)).returning();
    return updated || undefined;
  }

  // Bid operations (FB-Brain integration)
  async createBid(bid: InsertBid): Promise<Bid> {
    const [created] = await db.insert(bids).values(bid as any).returning();
    return created;
  }

  async getBidByRfq(rfqId: number): Promise<Bid | undefined> {
    const [bid] = await db.select().from(bids).where(eq(bids.rfqId, rfqId));
    return bid || undefined;
  }

  async updateBidStatus(id: number, status: BidStatus): Promise<Bid | undefined> {
    const [updated] = await db.update(bids).set({ status }).where(eq(bids.id, id)).returning();
    return updated || undefined;
  }

  // Agent config operations
  async getAgentConfigs(siteId: string): Promise<AgentConfig[]> {
    return db.select().from(agentConfigs).where(eq(agentConfigs.siteId, siteId));
  }

  async getAgentConfig(siteId: string, agentType: AgentType): Promise<AgentConfig | undefined> {
    const [config] = await db.select().from(agentConfigs)
      .where(and(eq(agentConfigs.siteId, siteId), eq(agentConfigs.agentType, agentType as any)));
    return config || undefined;
  }

  async upsertAgentConfig(config: InsertAgentConfig): Promise<AgentConfig> {
    const existing = await this.getAgentConfig(config.siteId, config.agentType as AgentType);
    if (existing) {
      // Merge: only overwrite fields that are explicitly provided (#8)
      const mergedUpdate: Record<string, any> = { updatedAt: new Date() };
      if (config.enabled !== undefined) mergedUpdate.enabled = config.enabled;
      if (config.schedule !== undefined) mergedUpdate.schedule = config.schedule;
      if (config.preferences !== undefined) mergedUpdate.preferences = config.preferences;
      if (config.lastRunAt !== undefined) mergedUpdate.lastRunAt = config.lastRunAt;
      const [updated] = await db.update(agentConfigs)
        .set(mergedUpdate)
        .where(eq(agentConfigs.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(agentConfigs).values(config as any).returning();
    return created;
  }

  // Agent execution operations
  async createAgentExecution(execution: InsertAgentExecution): Promise<AgentExecution> {
    const [created] = await db.insert(agentExecutions).values(execution as any).returning();
    return created;
  }

  async getAgentExecution(id: number): Promise<AgentExecution | undefined> {
    const [execution] = await db.select().from(agentExecutions).where(eq(agentExecutions.id, id));
    return execution || undefined;
  }

  async updateAgentExecution(id: number, data: Partial<AgentExecution>): Promise<AgentExecution | undefined> {
    const [updated] = await db.update(agentExecutions).set(data as any).where(eq(agentExecutions.id, id)).returning();
    return updated || undefined;
  }

  async getAgentExecutionsBySite(siteId: string, limit = 50): Promise<AgentExecution[]> {
    return db.select().from(agentExecutions)
      .where(eq(agentExecutions.siteId, siteId))
      .orderBy(desc(agentExecutions.createdAt))
      .limit(limit);
  }

  async getPendingAgentExecutions(limit = 10): Promise<AgentExecution[]> {
    return db.select().from(agentExecutions)
      .where(eq(agentExecutions.status, "pending"))
      .orderBy(agentExecutions.createdAt)
      .limit(limit);
  }

  // Atomically claim a pending execution using FOR UPDATE SKIP LOCKED (#3)
  async claimPendingExecution(): Promise<AgentExecution | null> {
    const result = await db.execute(sql`
      UPDATE agent_executions
      SET status = 'running', started_at = NOW()
      WHERE id = (
        SELECT id FROM agent_executions
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `);
    const rows = result.rows as any[];
    if (!rows || rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      siteId: row.site_id,
      agentType: row.agent_type,
      status: row.status,
      trigger: row.trigger,
      input: row.input,
      output: row.output,
      error: row.error,
      retryCount: row.retry_count ?? 0,
      tokensUsed: row.tokens_used,
      durationMs: row.duration_ms,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
    } as AgentExecution;
  }

  // Check if an agent already has a pending or running execution (#6, #18)
  async hasPendingOrRunningExecution(siteId: string, agentType: AgentType): Promise<boolean> {
    const result = await db.select({ id: agentExecutions.id })
      .from(agentExecutions)
      .where(and(
        eq(agentExecutions.siteId, siteId),
        eq(agentExecutions.agentType, agentType as any),
        sql`${agentExecutions.status} IN ('pending', 'running')`
      ))
      .limit(1);
    return result.length > 0;
  }

  // Get all overdue scheduled configs in one query (#2)
  async getOverdueScheduledConfigs(): Promise<AgentConfig[]> {
    return db.select().from(agentConfigs)
      .where(and(
        eq(agentConfigs.enabled, true),
        sql`${agentConfigs.schedule} != 'on_event'`,
        sql`(
          ${agentConfigs.lastRunAt} IS NULL
          OR (
            (${agentConfigs.schedule} = 'daily' AND ${agentConfigs.lastRunAt} < NOW() - INTERVAL '1 day')
            OR (${agentConfigs.schedule} = 'weekly' AND ${agentConfigs.lastRunAt} < NOW() - INTERVAL '7 days')
            OR (${agentConfigs.schedule} = 'monthly' AND ${agentConfigs.lastRunAt} < NOW() - INTERVAL '30 days')
          )
        )`
      ));
  }

  // Get leads in a date range without loading all leads (#16)
  async getLeadsBySiteIdInDateRange(siteId: string, start: Date, end: Date): Promise<Lead[]> {
    return db.select().from(leads)
      .where(and(
        eq(leads.siteId, siteId),
        gte(leads.createdAt, start),
        lte(leads.createdAt, end)
      ));
  }

  // Cleanup old executions (#25)
  async cleanupOldExecutions(olderThanDays: number): Promise<number> {
    const result = await db.execute(sql`
      DELETE FROM agent_executions
      WHERE status IN ('completed', 'failed', 'cancelled')
      AND created_at < NOW() - ${olderThanDays} * INTERVAL '1 day'
    `);
    return (result as any).rowCount || 0;
  }

  // Mark stale 'running' executions as failed (#17)
  async markStaleRunningExecutions(olderThanMs: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanMs);
    const result = await db.update(agentExecutions)
      .set({
        status: "failed" as any,
        error: "Execution timed out (stale running state)",
        completedAt: new Date(),
      } as any)
      .where(and(
        eq(agentExecutions.status, "running" as any),
        lte(agentExecutions.startedAt, cutoff)
      ));
    return (result as any).rowCount || 0;
  }

  // Generated content operations
  async createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent> {
    const [created] = await db.insert(generatedContent).values(content as any).returning();
    return created;
  }

  async getGeneratedContentBySite(siteId: string, status?: ContentReviewStatus, limit = 100, cursor?: number): Promise<GeneratedContent[]> {
    const conditions = [eq(generatedContent.siteId, siteId)];
    if (status) {
      conditions.push(eq(generatedContent.status, status));
    }
    if (cursor) {
      conditions.push(lt(generatedContent.id, cursor));
    }
    return db.select().from(generatedContent)
      .where(and(...conditions))
      .orderBy(desc(generatedContent.id))
      .limit(limit);
  }

  async getGeneratedContentById(id: number): Promise<GeneratedContent | undefined> {
    const [content] = await db.select().from(generatedContent).where(eq(generatedContent.id, id));
    return content || undefined;
  }

  async updateGeneratedContentStatus(id: number, status: ContentReviewStatus, reviewedBy?: string): Promise<GeneratedContent | undefined> {
    const updateData: Record<string, any> = { status };
    if (reviewedBy) {
      updateData.reviewedBy = reviewedBy;
      updateData.reviewedAt = new Date();
    }
    const [updated] = await db.update(generatedContent).set(updateData).where(eq(generatedContent.id, id)).returning();
    return updated || undefined;
  }

  // Transactional content approval — atomically locks the row, approves, and applies to page
  async approveAndApplyContent(id: number, siteId: string, reviewedBy?: string): Promise<{ content: GeneratedContent; applied: boolean }> {
    return db.transaction(async (tx) => {
      // Lock the row with FOR UPDATE to prevent concurrent approvals
      const lockedRows = await tx.execute(sql`
        SELECT * FROM generated_content
        WHERE id = ${id} AND site_id = ${siteId} AND status = 'pending_review'
        FOR UPDATE
      `);
      const rows = lockedRows.rows as any[];
      if (!rows || rows.length === 0) {
        throw new Error("Content not found, already reviewed, or does not belong to this site");
      }
      const row = rows[0];

      // Mark as approved
      const updateData: Record<string, any> = { status: "approved", reviewedAt: new Date() };
      if (reviewedBy) updateData.reviewedBy = reviewedBy;
      const [approved] = await tx.update(generatedContent).set(updateData).where(eq(generatedContent.id, id)).returning();

      let applied = false;

      // If it's a meta_description or page_update, apply to page atomically
      if (row.target_page && (row.content_type === "meta_description" || row.content_type === "page_update")) {
        const slug = (row.target_page as string).replace(/^\//, "");
        const [targetPage] = await tx.select().from(pages)
          .where(and(eq(pages.siteId, siteId), eq(pages.slug, slug)));

        if (targetPage) {
          const currentPageContent = (targetPage.content || {}) as Record<string, any>;
          const proposedContent = (row.content || {}) as Record<string, any>;
          const updatedContent = { ...currentPageContent };

          if (row.content_type === "meta_description") {
            if (proposedContent.proposedValue) updatedContent.metaDescription = proposedContent.proposedValue;
            if (proposedContent.proposedTitle) updatedContent.metaTitle = proposedContent.proposedTitle;
          } else if (row.content_type === "page_update") {
            if (proposedContent.proposedValue) updatedContent.content = proposedContent.proposedValue;
          }

          await tx.update(pages).set({ content: updatedContent } as any)
            .where(and(eq(pages.siteId, siteId), eq(pages.slug, slug)));
          await tx.update(generatedContent).set({ status: "applied" } as any).where(eq(generatedContent.id, id));
          applied = true;
        }
      }

      return { content: approved, applied };
    });
  }

  // Cursor-based pagination for executions
  async getAgentExecutionsBySitePaginated(siteId: string, limit: number, cursor?: number): Promise<AgentExecution[]> {
    const conditions = [eq(agentExecutions.siteId, siteId)];
    if (cursor) {
      conditions.push(lt(agentExecutions.id, cursor));
    }
    return db.select().from(agentExecutions)
      .where(and(...conditions))
      .orderBy(desc(agentExecutions.id))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
