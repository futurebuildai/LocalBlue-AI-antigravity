/**
 * Shade Roofing Demo Seed Script
 *
 * Creates a fully-featured "Shade Roofing" demo tenant with realistic data
 * across every feature: pages, leads, testimonials, pricing, RFQs, bids,
 * analytics, AI agents, and generated content.
 *
 * Idempotent — checks for existing `shade-roofing` subdomain before inserting.
 *
 * Usage: npx tsx server/seed-shade-roofing.ts
 */

import { db } from "./db";
import {
  sites,
  tenantUsers,
  pages,
  leads,
  testimonials,
  servicePricing,
  rfqs,
  bids,
  analyticsDaily,
  seoMetrics,
  agentConfigs,
  agentExecutions,
  generatedContent,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

async function seedShadeRoofing() {
  console.log("=== Shade Roofing Demo Seeder ===\n");

  // Idempotency check
  const [existing] = await db
    .select()
    .from(sites)
    .where(eq(sites.subdomain, "shade-roofing"));
  if (existing) {
    console.log(`Shade Roofing site already exists (ID: ${existing.id}). Skipping seed.`);
    console.log("To re-seed, delete the site first:");
    console.log("  DELETE FROM sites WHERE subdomain = 'shade-roofing';");
    process.exit(0);
  }

  // ── Site ──────────────────────────────────────────────────────────────
  console.log("Creating site...");
  const [site] = await db
    .insert(sites)
    .values({
      subdomain: "shade-roofing",
      businessName: "Shade Roofing",
      brandColor: "#1E3A5F",
      tradeType: "roofer",
      stylePreference: "professional",
      serviceArea: "Phoenix, AZ Metro",
      isPublished: true,
      subscriptionPlan: "growth",
      trialPhase: "active",
      phone: "(602) 555-7890",
      email: "info@shaderoofing.com",
      address: "4821 E McDowell Rd, Phoenix, AZ 85008",
      services: [
        "Roof Installation",
        "Roof Repair",
        "Storm Damage Repair",
        "Roof Inspections",
        "Gutter Installation",
        "Commercial Roofing",
      ],
      tagline: "Phoenix's Most Trusted Roofing Team",
      businessDescription:
        "Shade Roofing has been protecting Phoenix homes and businesses from the Arizona sun for over 12 years. We specialize in heat-resistant roofing systems, tile replacements, and emergency storm damage repair. As a family-owned company, we treat every roof like it's our own.",
      yearsInBusiness: 12,
      totalYearsExperience: 18,
      projectsPerYear: 150,
      ownerName: "Marcus Shade",
      ownerStory:
        "Marcus Shade started his roofing career at 18, working summers for his uncle's company in Tucson. After earning his contractor's license and a decade of experience across the Valley, he founded Shade Roofing with a simple promise: honest work, fair prices, and roofs that last.",
      uniqueSellingPoints: [
        "Licensed, bonded & insured (ROC #302145)",
        "Heat-reflective coating specialists",
        "24/7 emergency storm response",
        "Free drone-assisted inspections",
      ],
      certifications: [
        "GAF Master Elite Contractor",
        "Owens Corning Preferred",
        "OSHA 30-Hour Certified",
        "BBB A+ Rated",
      ],
      selectedPages: ["home", "services", "about", "contact", "gallery"],
      enableChatbot: true,
      chatbotFaqs: [
        { question: "Do you offer free estimates?", answer: "Yes! We offer free, no-obligation estimates for all roofing projects. We can even perform a free drone inspection." },
        { question: "Are you licensed and insured?", answer: "Absolutely. Shade Roofing is fully licensed (ROC #302145), bonded, and insured for your protection." },
        { question: "How long does a roof replacement take?", answer: "Most residential roof replacements are completed in 1-3 days, depending on the size and complexity of your roof." },
      ],
      enableQuoteCalculator: true,
      enableProjectGallery: true,
    })
    .returning();

  console.log(`  Site created: ${site.businessName} (ID: ${site.id})`);

  // ── Tenant User ───────────────────────────────────────────────────────
  console.log("Creating tenant user...");
  const hashedPassword = await bcrypt.hash("demo123", SALT_ROUNDS);
  const [user] = await db
    .insert(tenantUsers)
    .values({
      email: "shade+localblue@futurebuild.ai",
      password: hashedPassword,
      siteId: site.id,
      role: "owner",
    })
    .returning();

  console.log(`  User created: ${user.email} (ID: ${user.id})`);

  // ── Pages ─────────────────────────────────────────────────────────────
  console.log("Creating pages...");
  const pageData = [
    {
      siteId: site.id,
      slug: "home",
      title: "Home",
      content: {
        heroHeadline: "Phoenix's Most Trusted Roofing Team",
        heroSubheadline: "Serving the Phoenix Metro Area Since 2014",
        heroDescription:
          "From tile replacements to full roof installations, Shade Roofing delivers expert craftsmanship backed by industry-leading warranties. Get a free drone-assisted inspection today.",
        featuredServices: [
          "Roof Installation",
          "Roof Repair",
          "Storm Damage Repair",
          "Roof Inspections",
          "Gutter Installation",
          "Commercial Roofing",
        ],
        serviceDescriptions: {
          "Roof Installation":
            "Complete roof installation with premium materials rated for Arizona heat. We work with tile, shingle, flat, and metal roofing systems.",
          "Roof Repair":
            "Fast, reliable repairs for leaks, missing shingles, cracked tiles, and weather damage. Most repairs completed same-day.",
          "Storm Damage Repair":
            "24/7 emergency response for monsoon and hail damage. We handle insurance claims from start to finish.",
          "Roof Inspections":
            "Free drone-assisted roof inspections with detailed photo reports. Know your roof's condition without anyone climbing on it.",
          "Gutter Installation":
            "Seamless aluminum gutters custom-fitted to your home. Protect your foundation from Arizona's intense monsoon rains.",
          "Commercial Roofing":
            "Flat roof systems, TPO, and modified bitumen for commercial properties. Minimize business disruption with our efficient crews.",
        },
        trustStatements: [
          "Licensed, Bonded & Insured (ROC #302145)",
          "GAF Master Elite Contractor",
          "4.9 Stars on Google (200+ Reviews)",
          "12+ Years Serving Phoenix",
        ],
        ctaPrimary: "Get Your Free Inspection",
        ctaSecondary: "Call Now",
        ctaPhone: "(602) 555-7890",
        whyChooseUsTitle: "Why Phoenix Homeowners Choose Shade Roofing",
      },
    },
    {
      siteId: site.id,
      slug: "services",
      title: "Our Services",
      content: {
        servicesList: [
          {
            name: "Roof Installation",
            description:
              "Complete roof installation with premium materials rated for Arizona heat. We work with tile, shingle, flat, and metal roofing systems.",
            icon: "roofer",
            order: 0,
            faqs: [],
          },
          {
            name: "Roof Repair",
            description:
              "Fast, reliable repairs for leaks, missing shingles, cracked tiles, and weather damage. Most repairs completed same-day.",
            icon: "roofer",
            order: 1,
            faqs: [],
          },
          {
            name: "Storm Damage Repair",
            description:
              "24/7 emergency response for monsoon and hail damage. We handle insurance claims from start to finish.",
            icon: "roofer",
            order: 2,
            faqs: [],
          },
          {
            name: "Roof Inspections",
            description:
              "Free drone-assisted roof inspections with detailed photo reports. Know your roof's condition without anyone climbing on it.",
            icon: "roofer",
            order: 3,
            faqs: [],
          },
          {
            name: "Gutter Installation",
            description:
              "Seamless aluminum gutters custom-fitted to your home. Protect your foundation from Arizona's intense monsoon rains.",
            icon: "roofer",
            order: 4,
            faqs: [],
          },
          {
            name: "Commercial Roofing",
            description:
              "Flat roof systems, TPO, and modified bitumen for commercial properties. Minimize business disruption with our efficient crews.",
            icon: "roofer",
            order: 5,
            faqs: [],
          },
        ],
        serviceArea: "Phoenix, AZ Metro",
        serviceAreaDescription:
          "We serve the entire Phoenix Metropolitan Area including Scottsdale, Tempe, Mesa, Chandler, Gilbert, Glendale, and Peoria.",
        ctaText: "Request a Free Quote",
      },
    },
    {
      siteId: site.id,
      slug: "about",
      title: "About Us",
      content: {
        sectionTitle: "The Shade Roofing Story",
        companyStory:
          "Marcus Shade started his roofing career at 18, working summers for his uncle's company in Tucson. After earning his contractor's license and a decade of experience across the Valley, he founded Shade Roofing with a simple promise: honest work, fair prices, and roofs that last. Today, our crew of 15 treats every project — from a simple leak repair to a full commercial re-roof — with the same care and attention to detail.",
        ownerName: "Marcus Shade",
        yearsInBusiness: 12,
        totalYearsExperience: 18,
        projectsPerYear: 150,
        uniqueSellingPoints: [
          "Licensed, bonded & insured (ROC #302145)",
          "Heat-reflective coating specialists",
          "24/7 emergency storm response",
          "Free drone-assisted inspections",
        ],
        certifications: [
          "GAF Master Elite Contractor",
          "Owens Corning Preferred",
          "OSHA 30-Hour Certified",
          "BBB A+ Rated",
        ],
        serviceAreaDescription:
          "We proudly serve the Phoenix Metro Area including Scottsdale, Tempe, Mesa, Chandler, Gilbert, Glendale, and Peoria.",
      },
    },
    {
      siteId: site.id,
      slug: "contact",
      title: "Contact Us",
      content: {
        phone: "(602) 555-7890",
        email: "info@shaderoofing.com",
        address: "4821 E McDowell Rd, Phoenix, AZ 85008",
        businessHours: "Mon-Fri: 7am-6pm, Sat: 8am-2pm, Sun: Emergency Only",
        contactFormEnabled: true,
        mapEnabled: true,
      },
    },
    {
      siteId: site.id,
      slug: "gallery",
      title: "Project Gallery",
      content: {
        galleryDescription:
          "View our recent roofing projects across the Phoenix Metro Area and see the quality of our work.",
        projects: [],
        categories: ["project", "before", "after"],
        hasPhotos: false,
      },
    },
  ];

  for (const page of pageData) {
    await db.insert(pages).values(page);
  }
  console.log(`  ${pageData.length} pages created`);

  // ── Leads ─────────────────────────────────────────────────────────────
  console.log("Creating leads...");
  const leadsData = [
    {
      siteId: site.id,
      name: "Jennifer Martinez",
      email: "jennifer.m@email.com",
      phone: "(602) 555-1001",
      message: "We had some tiles blow off during last night's storm. Need emergency repair ASAP. Water is getting into the attic.",
      stage: "new" as const,
      priority: "high" as const,
      source: "website",
      aiScore: 85,
      aiSuggestedActions: [
        { action: "Call within 1 hour", reason: "Emergency storm damage — high urgency, high conversion probability", priority: "high" },
        { action: "Schedule same-day inspection", reason: "Active water intrusion requires immediate assessment", priority: "high" },
      ],
      aiScoredAt: hoursAgo(2),
      estimatedValue: 4500,
      createdAt: hoursAgo(3),
    },
    {
      siteId: site.id,
      name: "Tom Bradley",
      email: "tom.b@email.com",
      phone: "(480) 555-1002",
      message: "Just curious about prices for a new roof. Our house is about 2000 sq ft. No rush.",
      stage: "new" as const,
      priority: "low" as const,
      source: "google",
      aiScore: 42,
      aiSuggestedActions: [
        { action: "Send pricing guide email", reason: "Early-stage research — nurture with educational content", priority: "medium" },
      ],
      aiScoredAt: hoursAgo(6),
      estimatedValue: 12000,
      createdAt: hoursAgo(8),
    },
    {
      siteId: site.id,
      name: "Sarah Chen",
      email: "sarah.chen@email.com",
      phone: "(602) 555-1003",
      message: "We need a roof inspection before listing our house for sale. Real estate agent recommended you.",
      stage: "contacted" as const,
      priority: "high" as const,
      source: "referral",
      aiScore: 72,
      aiSuggestedActions: [
        { action: "Offer premium inspection package", reason: "Pre-sale inspection — referral source increases trust", priority: "high" },
        { action: "Mention certification report for buyers", reason: "Adds value for their sale process", priority: "medium" },
      ],
      aiScoredAt: daysAgo(1),
      lastContactedAt: daysAgo(1),
      estimatedValue: 800,
      createdAt: daysAgo(2),
    },
    {
      siteId: site.id,
      name: "David Kim",
      email: "david.k@email.com",
      phone: "(623) 555-1004",
      message: "Looking for commercial roofing quote for our warehouse. About 15,000 sq ft flat roof.",
      stage: "contacted" as const,
      priority: "medium" as const,
      source: "google",
      aiScore: 61,
      aiSuggestedActions: [
        { action: "Schedule on-site assessment", reason: "Commercial project — needs in-person evaluation for accurate bid", priority: "high" },
      ],
      aiScoredAt: daysAgo(2),
      lastContactedAt: daysAgo(1),
      estimatedValue: 45000,
      createdAt: daysAgo(3),
    },
    {
      siteId: site.id,
      name: "Maria Rodriguez",
      email: "maria.r@email.com",
      phone: "(480) 555-1005",
      message: "Interested in upgrading to a tile roof from shingles. Our HOA requires tile. Need quote for 1800 sq ft home.",
      stage: "quoted" as const,
      priority: "high" as const,
      source: "website",
      aiScore: 90,
      aiSuggestedActions: [
        { action: "Follow up on quote", reason: "HOA requirement means high motivation — likely to convert", priority: "high" },
        { action: "Offer financing options", reason: "Tile upgrade is premium — financing reduces friction", priority: "medium" },
      ],
      aiScoredAt: daysAgo(3),
      lastContactedAt: daysAgo(2),
      estimatedValue: 18000,
      createdAt: daysAgo(5),
    },
    {
      siteId: site.id,
      name: "Robert Johnson",
      email: "robert.j@email.com",
      phone: "(602) 555-1006",
      message: "Need gutters installed on both sides of the house. Also want to get the fascia boards checked.",
      stage: "quoted" as const,
      priority: "medium" as const,
      source: "referral",
      aiScore: 55,
      aiSuggestedActions: [
        { action: "Send follow-up with before/after photos", reason: "Visual proof increases conversion for aesthetic upgrades", priority: "medium" },
      ],
      aiScoredAt: daysAgo(4),
      lastContactedAt: daysAgo(3),
      estimatedValue: 3200,
      createdAt: daysAgo(7),
    },
    {
      siteId: site.id,
      name: "Angela Thompson",
      email: "angela.t@email.com",
      phone: "(480) 555-1007",
      message: "Completed a full tile roof replacement. Amazing work by the crew!",
      stage: "won" as const,
      priority: "high" as const,
      source: "website",
      aiScore: 95,
      aiSuggestedActions: [
        { action: "Request Google review", reason: "Happy customer — capitalize on satisfaction for social proof", priority: "high" },
        { action: "Add to referral program", reason: "High-value completed project — potential for repeat business", priority: "medium" },
      ],
      aiScoredAt: daysAgo(10),
      lastContactedAt: daysAgo(8),
      estimatedValue: 16500,
      createdAt: daysAgo(21),
    },
    {
      siteId: site.id,
      name: "Kevin O'Brien",
      email: "kevin.ob@email.com",
      phone: "(623) 555-1008",
      message: "Want to get a quote for roof coating. Saw your ad online.",
      stage: "lost" as const,
      priority: "low" as const,
      source: "google",
      aiScore: 30,
      aiSuggestedActions: [
        { action: "Send seasonal promotion in 3 months", reason: "Low-priority lost lead — worth a re-engagement attempt later", priority: "low" },
      ],
      aiScoredAt: daysAgo(15),
      lastContactedAt: daysAgo(12),
      estimatedValue: 2800,
      createdAt: daysAgo(20),
    },
  ];

  for (const lead of leadsData) {
    await db.insert(leads).values(lead);
  }
  console.log(`  ${leadsData.length} leads created`);

  // ── Testimonials ──────────────────────────────────────────────────────
  console.log("Creating testimonials...");
  const testimonialsData = [
    {
      siteId: site.id,
      customerName: "Lisa & Mark Patterson",
      customerLocation: "Scottsdale, AZ",
      rating: 5,
      content:
        "Marcus and his crew replaced our entire tile roof in just two days. They were professional, clean, and the price was exactly what they quoted — no surprises. Our house looks brand new from the street.",
      projectType: "Roof Installation",
      isVisible: true,
    },
    {
      siteId: site.id,
      customerName: "James Whitfield",
      customerLocation: "Mesa, AZ",
      rating: 5,
      content:
        "Called Shade Roofing at 11pm during a monsoon when water started coming through our ceiling. They had someone out first thing in the morning, tarped the damage, and completed the full repair by the end of the week. Life savers.",
      projectType: "Storm Damage Repair",
      isVisible: true,
    },
    {
      siteId: site.id,
      customerName: "Patricia Nguyen",
      customerLocation: "Chandler, AZ",
      rating: 5,
      content:
        "Got a free drone inspection and was impressed by how thorough the report was. They found issues my previous roofer missed. Fair pricing and great communication throughout the repair.",
      projectType: "Roof Inspections",
      isVisible: true,
    },
    {
      siteId: site.id,
      customerName: "Carlos & Elena Mendoza",
      customerLocation: "Tempe, AZ",
      rating: 4,
      content:
        "Shade Roofing installed new gutters on our home and cleaned everything up perfectly. The only reason for 4 stars instead of 5 is we had to reschedule once due to weather, but they were very communicative about it.",
      projectType: "Gutter Installation",
      isVisible: true,
    },
    {
      siteId: site.id,
      customerName: "Richard Allen",
      customerLocation: "Gilbert, AZ",
      rating: 5,
      content:
        "Used Shade for our warehouse roof. They managed to do most of the work on weekends so we didn't have to close the business. The new TPO roof has already lowered our cooling costs. Great commercial roofing team.",
      projectType: "Commercial Roofing",
      isVisible: true,
    },
  ];

  for (const t of testimonialsData) {
    await db.insert(testimonials).values(t);
  }
  console.log(`  ${testimonialsData.length} testimonials created`);

  // ── Service Pricing ───────────────────────────────────────────────────
  console.log("Creating service pricing...");
  const pricingData = [
    {
      siteId: site.id,
      serviceName: "Roof Installation",
      basePrice: 850,
      priceUnit: "per square (100 sq ft)",
      description: "Complete tear-off and installation with new underlayment, flashing, and ventilation. Includes cleanup and warranty registration.",
      isActive: true,
    },
    {
      siteId: site.id,
      serviceName: "Roof Repair",
      basePrice: 450,
      priceUnit: "per job",
      description: "Patch leaks, replace damaged shingles or tiles, re-seal flashing. Most repairs completed same-day.",
      isActive: true,
    },
    {
      siteId: site.id,
      serviceName: "Storm Damage Repair",
      basePrice: 1200,
      priceUnit: "per job",
      description: "Emergency tarping, damage assessment, insurance documentation, and full repair. 24/7 response available.",
      isActive: true,
    },
    {
      siteId: site.id,
      serviceName: "Roof Inspections",
      basePrice: 0,
      priceUnit: "per job",
      description: "Free drone-assisted roof inspection with detailed photo report and condition assessment.",
      isActive: true,
    },
    {
      siteId: site.id,
      serviceName: "Gutter Installation",
      basePrice: 12,
      priceUnit: "per linear ft",
      description: "Seamless aluminum gutters, custom-cut on-site. Includes downspouts, hangers, and end caps.",
      isActive: true,
    },
    {
      siteId: site.id,
      serviceName: "Commercial Roofing",
      basePrice: 650,
      priceUnit: "per square (100 sq ft)",
      description: "TPO, EPDM, and modified bitumen systems for flat and low-slope commercial roofs. Includes membrane, insulation, and flashing.",
      isActive: true,
    },
  ];

  for (const p of pricingData) {
    await db.insert(servicePricing).values(p);
  }
  console.log(`  ${pricingData.length} service pricing entries created`);

  // ── RFQs ──────────────────────────────────────────────────────────────
  console.log("Creating RFQs...");
  const [rfq1] = await db
    .insert(rfqs)
    .values({
      siteId: site.id,
      externalRfqId: "FB-RFQ-2026-0451",
      builderName: "Sundance Homes",
      projectName: "Ironwood Estates Lot 14 — Re-Roof",
      projectAddress: "7412 E Ironwood Dr, Scottsdale, AZ 85258",
      phaseDescription: "Full residential re-roof: tear-off existing 3-tab shingles, install new synthetic underlayment and concrete S-tile. Approx 2,200 sq ft.",
      scopeItems: [
        { item: "Tear-off existing shingles", quantity: 22, unit: "squares" },
        { item: "Install synthetic underlayment", quantity: 22, unit: "squares" },
        { item: "Install concrete S-tile", quantity: 22, unit: "squares" },
        { item: "Replace pipe boots & flashing", quantity: 1, unit: "lot" },
        { item: "Install new ridge cap", quantity: 85, unit: "linear ft" },
      ],
      startDate: formatDate(daysAgo(-14)),
      status: "pending",
      expiresAt: daysAgo(-7),
      createdAt: daysAgo(2),
    })
    .returning();

  const [rfq2] = await db
    .insert(rfqs)
    .values({
      siteId: site.id,
      externalRfqId: "FB-RFQ-2026-0423",
      builderName: "Desert Ridge Development",
      projectName: "Mesa Commerce Center — Flat Roof Repair",
      projectAddress: "2100 W Broadway Rd, Mesa, AZ 85202",
      phaseDescription: "Repair and recoat 8,000 sq ft flat roof section. Patch existing leaks, apply elastomeric coating.",
      scopeItems: [
        { item: "Leak identification & patching", quantity: 8, unit: "locations" },
        { item: "Surface preparation & cleaning", quantity: 80, unit: "squares" },
        { item: "Elastomeric roof coating", quantity: 80, unit: "squares" },
      ],
      startDate: formatDate(daysAgo(-7)),
      status: "viewed",
      expiresAt: daysAgo(-3),
      createdAt: daysAgo(5),
    })
    .returning();

  const [rfq3] = await db
    .insert(rfqs)
    .values({
      siteId: site.id,
      externalRfqId: "FB-RFQ-2026-0389",
      builderName: "Valley Premier Builders",
      projectName: "Arcadia Bungalow Renovation — New Roof",
      projectAddress: "3340 N 42nd St, Phoenix, AZ 85018",
      phaseDescription: "New roof for historic bungalow renovation. Remove wood shakes, install architectural shingles with ice & water shield. Approx 1,400 sq ft.",
      scopeItems: [
        { item: "Remove existing wood shakes", quantity: 14, unit: "squares" },
        { item: "Install ice & water shield", quantity: 14, unit: "squares" },
        { item: "Install architectural shingles", quantity: 14, unit: "squares" },
        { item: "New drip edge & flashing", quantity: 1, unit: "lot" },
      ],
      startDate: formatDate(daysAgo(-30)),
      status: "bid_submitted",
      expiresAt: daysAgo(-21),
      createdAt: daysAgo(14),
    })
    .returning();

  console.log(`  3 RFQs created`);

  // ── Bids ──────────────────────────────────────────────────────────────
  console.log("Creating bids...");
  await db.insert(bids).values({
    rfqId: rfq2.id,
    siteId: site.id,
    totalAmountCents: 2850000,
    laborCostCents: 1600000,
    notes: "Price includes full surface prep, two coats of elastomeric coating, and 5-year workmanship warranty. Can start within 5 business days of acceptance.",
    lineItems: [
      { description: "Leak patching (8 locations)", amountCents: 480000 },
      { description: "Surface prep & power wash", amountCents: 320000 },
      { description: "Elastomeric coating — 2 coats (80 squares)", amountCents: 1600000 },
      { description: "Cleanup & debris removal", amountCents: 150000 },
      { description: "5-year workmanship warranty", amountCents: 300000 },
    ],
    estimatedDays: 4,
    status: "draft",
    createdAt: daysAgo(4),
  });

  await db.insert(bids).values({
    rfqId: rfq3.id,
    siteId: site.id,
    totalAmountCents: 1420000,
    laborCostCents: 780000,
    notes: "Includes premium architectural shingles (Owens Corning Duration), full ice & water shield, new drip edge. 10-year workmanship warranty. Historic bungalow requires careful detail work.",
    lineItems: [
      { description: "Tear-off wood shakes (14 squares)", amountCents: 280000 },
      { description: "Ice & water shield installation", amountCents: 210000 },
      { description: "Architectural shingles — install", amountCents: 560000 },
      { description: "New drip edge & flashing", amountCents: 180000 },
      { description: "Cleanup & dump fees", amountCents: 120000 },
      { description: "10-year workmanship warranty", amountCents: 70000 },
    ],
    estimatedDays: 3,
    status: "submitted",
    submittedAt: daysAgo(12),
    createdAt: daysAgo(13),
  });

  console.log(`  2 bids created`);

  // ── Analytics Daily ───────────────────────────────────────────────────
  console.log("Creating 30 days of analytics...");
  const analyticsEntries = [];
  for (let i = 29; i >= 0; i--) {
    const date = daysAgo(i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Base traffic with weekday/weekend variation and slight uptrend
    const trendMultiplier = 1 + (29 - i) * 0.01;
    const baseViews = isWeekend ? 35 : 65;
    const jitter = Math.floor(Math.random() * 20) - 10;
    const pageViews = Math.max(10, Math.round((baseViews + jitter) * trendMultiplier));
    const uniqueVisitors = Math.round(pageViews * 0.7);

    analyticsEntries.push({
      siteId: site.id,
      date: formatDate(date),
      pageViews,
      uniqueVisitors,
      avgSessionDuration: 90 + Math.floor(Math.random() * 60),
      bounceRate: 35 + Math.floor(Math.random() * 15),
      topPages: [
        { page: "/", views: Math.round(pageViews * 0.4) },
        { page: "/services", views: Math.round(pageViews * 0.25) },
        { page: "/about", views: Math.round(pageViews * 0.15) },
        { page: "/contact", views: Math.round(pageViews * 0.12) },
        { page: "/gallery", views: Math.round(pageViews * 0.08) },
      ],
      topReferrers: [
        { referrer: "google.com", count: Math.round(uniqueVisitors * 0.45) },
        { referrer: "direct", count: Math.round(uniqueVisitors * 0.25) },
        { referrer: "yelp.com", count: Math.round(uniqueVisitors * 0.15) },
        { referrer: "facebook.com", count: Math.round(uniqueVisitors * 0.1) },
        { referrer: "nextdoor.com", count: Math.round(uniqueVisitors * 0.05) },
      ],
      deviceBreakdown: {
        desktop: Math.round(uniqueVisitors * 0.35),
        mobile: Math.round(uniqueVisitors * 0.55),
        tablet: Math.round(uniqueVisitors * 0.1),
      },
    });
  }

  for (const entry of analyticsEntries) {
    await db.insert(analyticsDaily).values(entry);
  }
  console.log(`  ${analyticsEntries.length} daily analytics entries created`);

  // ── SEO Metrics ───────────────────────────────────────────────────────
  console.log("Creating SEO metrics...");
  const seoData = [
    {
      siteId: site.id,
      month: "2026-02",
      keywords: [
        { keyword: "roofing company phoenix", position: 14, impressions: 1200, clicks: 85 },
        { keyword: "roof repair phoenix az", position: 8, impressions: 890, clicks: 112 },
        { keyword: "tile roof replacement scottsdale", position: 22, impressions: 340, clicks: 18 },
        { keyword: "storm damage roof repair", position: 11, impressions: 560, clicks: 62 },
        { keyword: "commercial roofing mesa az", position: 19, impressions: 210, clicks: 14 },
      ],
      organicTraffic: 980,
      totalLeads: 12,
      conversionRate: 1,
    },
    {
      siteId: site.id,
      month: "2026-03",
      keywords: [
        { keyword: "roofing company phoenix", position: 11, impressions: 1450, clicks: 130 },
        { keyword: "roof repair phoenix az", position: 6, impressions: 1020, clicks: 158 },
        { keyword: "tile roof replacement scottsdale", position: 18, impressions: 410, clicks: 28 },
        { keyword: "storm damage roof repair", position: 9, impressions: 680, clicks: 82 },
        { keyword: "commercial roofing mesa az", position: 15, impressions: 280, clicks: 22 },
      ],
      organicTraffic: 1340,
      totalLeads: 18,
      conversionRate: 1,
    },
  ];

  for (const s of seoData) {
    await db.insert(seoMetrics).values(s);
  }
  console.log(`  ${seoData.length} SEO metric entries created`);

  // ── Agent Configs ─────────────────────────────────────────────────────
  console.log("Creating agent configs...");
  const agentConfigData = [
    { siteId: site.id, agentType: "lead_scorer" as const, enabled: true, schedule: "on_event", lastRunAt: hoursAgo(2) },
    { siteId: site.id, agentType: "bid_advisor" as const, enabled: true, schedule: "on_event", lastRunAt: daysAgo(2) },
    { siteId: site.id, agentType: "content_optimizer" as const, enabled: true, schedule: "monthly", lastRunAt: daysAgo(5) },
    { siteId: site.id, agentType: "seo_agent" as const, enabled: true, schedule: "monthly", lastRunAt: daysAgo(3) },
    { siteId: site.id, agentType: "outreach_agent" as const, enabled: true, schedule: "weekly", lastRunAt: daysAgo(4) },
    { siteId: site.id, agentType: "analytics_insights" as const, enabled: true, schedule: "weekly", lastRunAt: daysAgo(1) },
  ];

  for (const config of agentConfigData) {
    await db.insert(agentConfigs).values(config);
  }
  console.log(`  ${agentConfigData.length} agent configs created`);

  // ── Agent Executions ──────────────────────────────────────────────────
  console.log("Creating agent executions...");
  const executionsData = [
    {
      siteId: site.id,
      agentType: "lead_scorer" as const,
      status: "completed" as const,
      trigger: "event",
      input: { leadId: 1, trigger: "new_lead" },
      output: { score: 85, factors: ["emergency_language", "storm_damage", "urgency_high"] },
      tokensUsed: 1250,
      durationMs: 3200,
      startedAt: hoursAgo(3),
      completedAt: hoursAgo(3),
      createdAt: hoursAgo(3),
    },
    {
      siteId: site.id,
      agentType: "lead_scorer" as const,
      status: "completed" as const,
      trigger: "event",
      input: { leadId: 2, trigger: "new_lead" },
      output: { score: 42, factors: ["low_urgency", "price_shopping", "no_timeline"] },
      tokensUsed: 1180,
      durationMs: 2800,
      startedAt: hoursAgo(7),
      completedAt: hoursAgo(7),
      createdAt: hoursAgo(7),
    },
    {
      siteId: site.id,
      agentType: "bid_advisor" as const,
      status: "completed" as const,
      trigger: "event",
      input: { rfqId: rfq3.id, trigger: "new_rfq" },
      output: { recommendedTotal: 1420000, confidence: "high", marketAnalysis: "competitive_pricing" },
      tokensUsed: 2400,
      durationMs: 5100,
      startedAt: daysAgo(13),
      completedAt: daysAgo(13),
      createdAt: daysAgo(13),
    },
    {
      siteId: site.id,
      agentType: "content_optimizer" as const,
      status: "completed" as const,
      trigger: "scheduled",
      input: { pages: ["home"], analysisType: "monthly_review" },
      output: { suggestions: 2, pages_analyzed: 5 },
      tokensUsed: 3800,
      durationMs: 8400,
      startedAt: daysAgo(5),
      completedAt: daysAgo(5),
      createdAt: daysAgo(5),
    },
    {
      siteId: site.id,
      agentType: "seo_agent" as const,
      status: "completed" as const,
      trigger: "scheduled",
      input: { analysisType: "keyword_optimization" },
      output: { optimizations: 3, keywords_tracked: 5 },
      tokensUsed: 2900,
      durationMs: 6200,
      startedAt: daysAgo(3),
      completedAt: daysAgo(3),
      createdAt: daysAgo(3),
    },
    {
      siteId: site.id,
      agentType: "outreach_agent" as const,
      status: "completed" as const,
      trigger: "scheduled",
      input: { targetBuilders: 3, campaignType: "introduction" },
      output: { emailsDrafted: 2, buildersAnalyzed: 3 },
      tokensUsed: 3100,
      durationMs: 7500,
      startedAt: daysAgo(4),
      completedAt: daysAgo(4),
      createdAt: daysAgo(4),
    },
    {
      siteId: site.id,
      agentType: "analytics_insights" as const,
      status: "completed" as const,
      trigger: "scheduled",
      input: { period: "weekly", dateRange: { from: formatDate(daysAgo(7)), to: formatDate(daysAgo(0)) } },
      output: { insights: 4, trafficTrend: "up", topSource: "google" },
      tokensUsed: 2100,
      durationMs: 4800,
      startedAt: daysAgo(1),
      completedAt: daysAgo(1),
      createdAt: daysAgo(1),
    },
    {
      siteId: site.id,
      agentType: "lead_scorer" as const,
      status: "completed" as const,
      trigger: "event",
      input: { leadId: 5, trigger: "new_lead" },
      output: { score: 90, factors: ["hoa_requirement", "specific_project", "clear_budget_signal"] },
      tokensUsed: 1320,
      durationMs: 3400,
      startedAt: daysAgo(5),
      completedAt: daysAgo(5),
      createdAt: daysAgo(5),
    },
    {
      siteId: site.id,
      agentType: "bid_advisor" as const,
      status: "completed" as const,
      trigger: "event",
      input: { rfqId: rfq1.id, trigger: "new_rfq" },
      output: { recommendedTotal: 2180000, confidence: "medium", marketAnalysis: "slightly_above_market" },
      tokensUsed: 2550,
      durationMs: 5600,
      startedAt: daysAgo(2),
      completedAt: daysAgo(2),
      createdAt: daysAgo(2),
    },
    {
      siteId: site.id,
      agentType: "outreach_agent" as const,
      status: "completed" as const,
      trigger: "scheduled",
      input: { targetBuilders: 2, campaignType: "follow_up" },
      output: { emailsDrafted: 1, buildersAnalyzed: 2 },
      tokensUsed: 2200,
      durationMs: 5200,
      startedAt: daysAgo(11),
      completedAt: daysAgo(11),
      createdAt: daysAgo(11),
    },
  ];

  const insertedExecutions = [];
  for (const exec of executionsData) {
    const [inserted] = await db.insert(agentExecutions).values(exec).returning();
    insertedExecutions.push(inserted);
  }
  console.log(`  ${insertedExecutions.length} agent executions created`);

  // ── Generated Content ─────────────────────────────────────────────────
  console.log("Creating generated content...");
  const contentData = [
    {
      siteId: site.id,
      executionId: insertedExecutions[8].id, // bid_advisor for rfq1
      agentType: "bid_advisor" as const,
      contentType: "bid_proposal" as const,
      title: "Bid Proposal — Ironwood Estates Lot 14 Re-Roof",
      content: {
        rfqId: rfq1.id,
        builderName: "Sundance Homes",
        projectName: "Ironwood Estates Lot 14 — Re-Roof",
        recommendedTotal: 2180000,
        lineItems: [
          { description: "Tear-off existing 3-tab shingles (22 squares)", amount: 440000 },
          { description: "Synthetic underlayment installation", amount: 264000 },
          { description: "Concrete S-tile — material & installation", amount: 990000 },
          { description: "Pipe boots, flashing, & ridge cap", amount: 286000 },
          { description: "Cleanup, dump fees, & debris removal", amount: 130000 },
          { description: "10-year workmanship warranty", amount: 70000 },
        ],
        estimatedDays: 3,
        notes: "Based on market analysis of similar projects in the Scottsdale area. Pricing is competitive for concrete S-tile installations. Recommend including warranty as a differentiator.",
        confidence: "medium",
      },
      status: "pending_review" as const,
      createdAt: daysAgo(2),
    },
    {
      siteId: site.id,
      executionId: insertedExecutions[3].id, // content_optimizer
      agentType: "content_optimizer" as const,
      contentType: "page_update" as const,
      targetPage: "home",
      title: "Homepage Hero Refresh — Seasonal Update",
      content: {
        heroHeadline: "Beat the Arizona Heat with a Roof Built to Last",
        heroSubheadline: "Monsoon Season Is Coming — Is Your Roof Ready?",
        heroDescription:
          "Don't wait for the first storm to find out. Get a free drone-assisted inspection from Phoenix's most trusted roofing team. We've protected over 1,800 homes since 2014.",
        rationale: "Current hero is strong but adding seasonal urgency (monsoon prep) can increase conversion during peak season (May-September). Data shows 40% more leads during monsoon-related messaging periods.",
      },
      currentContent: {
        heroHeadline: "Phoenix's Most Trusted Roofing Team",
        heroSubheadline: "Serving the Phoenix Metro Area Since 2014",
      },
      status: "pending_review" as const,
      createdAt: daysAgo(5),
    },
    {
      siteId: site.id,
      executionId: insertedExecutions[4].id, // seo_agent
      agentType: "seo_agent" as const,
      contentType: "meta_description" as const,
      targetPage: "services",
      title: "Services Page — Optimized Meta Description",
      content: {
        metaDescription:
          "Professional roofing services in Phoenix, AZ — roof installation, repair, storm damage, inspections & gutters. GAF Master Elite contractor. Free estimates. Call (602) 555-7890.",
        rationale: "Current meta description is generic. New version includes primary keywords ('roofing services phoenix'), trust signal ('GAF Master Elite'), CTA ('Free estimates'), and phone number for click-to-call.",
        targetKeywords: ["roofing services phoenix", "roof repair phoenix az", "GAF Master Elite contractor phoenix"],
      },
      status: "approved" as const,
      createdAt: daysAgo(3),
    },
    {
      siteId: site.id,
      executionId: insertedExecutions[5].id, // outreach_agent
      agentType: "outreach_agent" as const,
      contentType: "outreach_email" as const,
      title: "Outreach Email — Introduction to Copper Canyon Builders",
      content: {
        recipientBuilder: "Copper Canyon Builders",
        subject: "Roofing Partner for Your Phoenix Projects — {builder_company}",
        body: "Hi {builder_name},\n\nI'm Marcus Shade, owner of Shade Roofing here in Phoenix. I noticed {builder_company} has several residential projects underway in the East Valley, and I wanted to introduce our team as a potential roofing subcontractor.\n\nWe're a GAF Master Elite contractor with 12 years in the Valley, and we specialize in tile and shingle installations for new construction and renovations. Our crew handles 150+ projects a year, and we're known for on-time completion and clean job sites.\n\nWould you be open to a quick call this week to discuss how we could support your upcoming projects?\n\nBest,\nMarcus Shade\nShade Roofing\n(602) 555-7890",
      },
      status: "approved" as const,
      createdAt: daysAgo(4),
    },
    {
      siteId: site.id,
      executionId: insertedExecutions[6].id, // analytics_insights
      agentType: "analytics_insights" as const,
      contentType: "insight" as const,
      title: "Weekly Traffic Summary — March 16-22, 2026",
      content: {
        period: "March 16-22, 2026",
        highlights: [
          "Website traffic is up 12% week-over-week, driven primarily by organic search",
          "Mobile visitors now account for 55% of traffic — ensure contact forms are mobile-optimized",
          "'Roof repair phoenix az' moved from position 8 to position 6 — continue optimizing the services page",
          "Yelp referrals increased 20% — consider responding to recent reviews to boost engagement",
        ],
        metrics: {
          totalPageViews: 412,
          uniqueVisitors: 289,
          avgSessionDuration: 118,
          bounceRate: 38,
          topPage: "/",
          topReferrer: "google.com",
        },
      },
      status: "approved" as const,
      createdAt: daysAgo(1),
    },
    {
      siteId: site.id,
      executionId: insertedExecutions[9].id, // outreach_agent follow-up
      agentType: "outreach_agent" as const,
      contentType: "outreach_email" as const,
      title: "Outreach Email — Follow-up to Pinnacle Construction",
      content: {
        recipientBuilder: "Pinnacle Construction Group",
        subject: "Following Up — Roofing Support for {builder_company}",
        body: "Hi {builder_name},\n\nI reached out a couple of weeks ago about Shade Roofing potentially supporting {builder_company}'s roofing needs here in the Phoenix area.\n\nI know things get busy, so I wanted to follow up briefly. We recently completed a tile re-roof for Sundance Homes in Scottsdale and have capacity opening up next month.\n\nIf you're looking for a reliable roofing sub who shows up on time and keeps the site clean, I'd love to chat. Even a 10-minute call would be great.\n\nBest,\nMarcus Shade\nShade Roofing\n(602) 555-7890",
      },
      status: "pending_review" as const,
      createdAt: daysAgo(11),
    },
  ];

  for (const content of contentData) {
    await db.insert(generatedContent).values(content);
  }
  console.log(`  ${contentData.length} generated content items created`);

  // ── Summary ───────────────────────────────────────────────────────────
  console.log("");
  console.log("=== Shade Roofing Demo Seeding Complete ===");
  console.log("");
  console.log("Shade Roofing Credentials:");
  console.log("  Email:    shade+localblue@futurebuild.ai");
  console.log("  Password: demo123");
  console.log("");
  console.log("Data created:");
  console.log(`  - 1 site (subdomain: shade-roofing)`);
  console.log(`  - 1 tenant user (owner)`);
  console.log(`  - ${pageData.length} pages`);
  console.log(`  - ${leadsData.length} leads with AI scores`);
  console.log(`  - ${testimonialsData.length} testimonials`);
  console.log(`  - ${pricingData.length} service pricing entries`);
  console.log(`  - 3 RFQs (pending, viewed, bid_submitted)`);
  console.log(`  - 2 bids (draft, submitted)`);
  console.log(`  - ${analyticsEntries.length} days of analytics`);
  console.log(`  - ${seoData.length} months of SEO metrics`);
  console.log(`  - ${agentConfigData.length} agent configs (all enabled)`);
  console.log(`  - ${insertedExecutions.length} agent executions`);
  console.log(`  - ${contentData.length} generated content items`);
  console.log("");
  console.log("Access:");
  console.log(`  Demo page:  http://localhost:5000/demo/shade-roofing`);
  console.log(`  Admin:      http://admin.shade-roofing.localhost:5000`);
  console.log("");
}

seedShadeRoofing()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
