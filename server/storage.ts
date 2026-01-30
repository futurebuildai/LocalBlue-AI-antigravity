import { 
  users, sites,
  type User, type InsertUser,
  type Site, type InsertSite 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
