import { 
  tenantUsers, sites, conversations, messages, pages, leads,
  onboardingProgress, sitePhotos, testimonials, servicePricing, appointments, chatbotConversations,
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
  type ChatbotConversation, type InsertChatbotConversation
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

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
    }).returning();
    return site;
  }

  async updateSite(id: string, siteData: Partial<InsertSite>): Promise<Site | undefined> {
    const updateData = {
      ...siteData,
      services: siteData.services as string[] | undefined,
    };
    const [site] = await db.update(sites).set(updateData).where(eq(sites.id, id)).returning();
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

  // Lead operations
  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(insertLead).returning();
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
    const [created] = await db.insert(onboardingProgress).values(progress).returning();
    return created;
  }

  async updateOnboardingProgress(siteId: string, progressData: Partial<InsertOnboardingProgress>): Promise<OnboardingProgress | undefined> {
    const [updated] = await db.update(onboardingProgress)
      .set({ ...progressData, updatedAt: new Date() })
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
      .where(and(eq(sitePhotos.siteId, siteId), eq(sitePhotos.type, type)))
      .orderBy(sitePhotos.sortOrder);
  }

  async createSitePhoto(photo: InsertSitePhoto): Promise<SitePhoto> {
    const [created] = await db.insert(sitePhotos).values(photo).returning();
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
}

export const storage = new DatabaseStorage();
