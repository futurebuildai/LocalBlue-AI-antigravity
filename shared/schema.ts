import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  siteId: varchar("site_id").references(() => sites.id),
});

export const sites = pgTable("sites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subdomain: text("subdomain").notNull().unique(),
  customDomain: text("custom_domain"),
  businessName: text("business_name").notNull(),
  brandColor: text("brand_color").notNull().default("#3B82F6"),
  services: jsonb("services").$type<string[]>().default([]),
  isPublished: boolean("is_published").notNull().default(false),
});

export const usersRelations = relations(users, ({ one }) => ({
  site: one(sites, {
    fields: [users.siteId],
    references: [sites.id],
  }),
}));

export const sitesRelations = relations(sites, ({ many }) => ({
  users: many(users),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertSiteSchema = createInsertSchema(sites).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type Site = typeof sites.$inferSelect;
