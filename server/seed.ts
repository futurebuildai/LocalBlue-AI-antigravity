import { db } from "./db";
import { sites, tenantUsers } from "@shared/schema";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export async function seedDatabase() {
  try {
    // Check if we already have sites
    const existingSites = await db.select().from(sites);
    if (existingSites.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database with sample data...");

    // Create sample sites
    const sampleSites = [
      {
        subdomain: "acme",
        customDomain: null,
        businessName: "ACME Corporation",
        brandColor: "#EF4444",
        services: ["Consulting", "Software Development", "Cloud Services"],
        isPublished: true,
      },
      {
        subdomain: "bloom",
        customDomain: null,
        businessName: "Bloom Wellness Studio",
        brandColor: "#10B981",
        services: ["Yoga Classes", "Meditation", "Personal Training", "Nutrition Coaching"],
        isPublished: true,
      },
      {
        subdomain: "techpro",
        customDomain: null,
        businessName: "TechPro Solutions",
        brandColor: "#3B82F6",
        services: ["IT Support", "Network Security", "Data Recovery"],
        isPublished: false,
      },
    ];

    const createdSites = await db.insert(sites).values(sampleSites).returning();
    console.log(`Created ${createdSites.length} sample sites`);

    // Create sample users for each site
    const hashedPassword = await bcrypt.hash("password123", SALT_ROUNDS);

    const sampleUsers = [
      {
        email: "admin@acme.com",
        password: hashedPassword,
        siteId: createdSites[0].id,
      },
      {
        email: "john@acme.com",
        password: hashedPassword,
        siteId: createdSites[0].id,
      },
      {
        email: "sarah@bloom.com",
        password: hashedPassword,
        siteId: createdSites[1].id,
      },
      {
        email: "mike@techpro.com",
        password: hashedPassword,
        siteId: createdSites[2].id,
      },
    ];

    const createdUsers = await db.insert(tenantUsers).values(sampleUsers).returning();
    console.log(`Created ${createdUsers.length} sample tenant users`);

    console.log("Database seeding completed!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
