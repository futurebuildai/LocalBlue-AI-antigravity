import { 
  users, sites, conversations, messages, pages, leads,
  type User, type InsertUser,
  type Site, type InsertSite,
  type Conversation, type Message,
  type Page, type InsertPage,
  type Lead, type InsertLead
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUsersBySiteId(siteId: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;

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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async getUsersBySiteId(siteId: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.siteId, siteId));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
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
}

export const storage = new DatabaseStorage();
