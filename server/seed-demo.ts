/**
 * Demo seed script for FB-Brain integration.
 * Creates a "Demo Roofing Co" tenant site with an owner user.
 *
 * Usage: npx tsx server/seed-demo.ts
 */

import { db } from "./db";
import { sites, tenantUsers } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

async function seedDemoRoofer() {
  console.log("=== LocalBlue Demo Seeder ===");

  // Check if demo site already exists
  const [existing] = await db.select().from(sites).where(eq(sites.subdomain, "demo-roofer"));
  if (existing) {
    console.log(`Demo site already exists (ID: ${existing.id}). Skipping seed.`);
    console.log("To re-seed, delete the site first:");
    console.log("  DELETE FROM sites WHERE subdomain = 'demo-roofer';");
    process.exit(0);
  }

  // Create site
  const [site] = await db.insert(sites).values({
    subdomain: "demo-roofer",
    businessName: "Demo Roofing Co",
    brandColor: "#DC2626",
    tradeType: "roofer",
    stylePreference: "professional",
    serviceArea: "San Diego, CA",
    isPublished: true,
    phone: "(619) 555-1234",
    email: "owner@demo-roofing.com",
    services: ["Roof Installation", "Roof Repair", "Roof Inspection", "Emergency Tarping"],
    tagline: "San Diego's Most Trusted Roofers",
    businessDescription: "Demo Roofing Co provides professional roofing services throughout the San Diego area. With over 15 years of experience, we specialize in residential roof installations, repairs, and inspections.",
    yearsInBusiness: 15,
    totalYearsExperience: 20,
    projectsPerYear: 120,
    ownerName: "Demo Owner",
    selectedPages: ["home", "services", "about", "contact"],
    enableChatbot: false,
    enableQuoteCalculator: false,
    enableProjectGallery: true,
    subscriptionPlan: "growth",
    trialPhase: "active",
  }).returning();

  console.log(`Created site: ${site.businessName} (ID: ${site.id}, subdomain: ${site.subdomain})`);

  // Create owner user
  const hashedPassword = await bcrypt.hash("password123", SALT_ROUNDS);
  const [user] = await db.insert(tenantUsers).values({
    email: "owner@demo-roofing.com",
    password: hashedPassword,
    siteId: site.id,
    role: "owner",
  }).returning();

  console.log(`Created tenant user: ${user.email} (ID: ${user.id})`);

  console.log("");
  console.log("=== Demo Seeding Complete ===");
  console.log("");
  console.log("Demo Roofer Credentials:");
  console.log("  Email:    owner@demo-roofing.com");
  console.log("  Password: password123");
  console.log(`  Admin:    http://admin.demo-roofer.localhost:5000`);
  console.log("");
}

seedDemoRoofer()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
