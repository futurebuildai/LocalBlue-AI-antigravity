import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tenantMiddleware, requireTenant, requireTenantAdmin, requireTenantAuth, requirePlatformAdmin } from "./middleware/tenantMiddleware";
import { insertTenantUserSchema, insertSiteSchema, insertLeadSchema, TRADE_TYPES, type TradeType, type StylePreference } from "@shared/schema";
import { TRADE_TEMPLATES, STYLE_TEMPLATES, AVAILABLE_PAGES, getTradeTemplate, getStyleTemplate } from "@shared/tradeTemplates";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { sendLeadNotification, sendWelcomeEmail } from "./services/email";
import bcrypt from "bcrypt";
import { z } from "zod";
import jwt from "jsonwebtoken";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(2),
});

const SALT_ROUNDS = 10;

function generateSubdomain(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
}

function generateRandomSuffix(): string {
  return Math.random().toString(36).substring(2, 6);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Replit Auth before other routes
  await setupAuth(app);
  registerAuthRoutes(app);

  // Apply tenant middleware globally
  app.use(tenantMiddleware);

  // ============================================
  // Admin API Routes (Platform Admin only)
  // ============================================
  
  // Apply platform admin auth to all /api/admin routes
  app.use("/api/admin", requirePlatformAdmin);

  // --- Sites CRUD ---
  
  // Get all sites
  app.get("/api/admin/sites", async (req, res) => {
    try {
      const sites = await storage.getAllSites();
      res.json(sites);
    } catch (error) {
      console.error("Error fetching sites:", error);
      res.status(500).json({ error: "Failed to fetch sites" });
    }
  });

  // Get all sites with enhanced data (lead count, onboarding status, last activity)
  app.get("/api/admin/sites/enhanced", async (req, res) => {
    try {
      const allSites = await storage.getAllSites();
      
      const enhancedSites = await Promise.all(
        allSites.map(async (site) => {
          // Get leads for this site
          const siteLeads = await storage.getLeadsBySiteId(site.id);
          const leadCount = siteLeads.length;
          
          // Get onboarding progress
          const progress = await storage.getOnboardingProgress(site.id);
          let onboardingStatus: string;
          if (!progress) {
            onboardingStatus = "not_started";
          } else if (progress.currentPhase === "complete") {
            onboardingStatus = "completed";
          } else {
            onboardingStatus = progress.currentPhase;
          }
          
          // Calculate last activity (most recent lead or onboarding update)
          let lastActivity: Date | null = null;
          
          // Check most recent lead (sort to ensure we get the latest)
          const sortedLeads = [...siteLeads].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          if (sortedLeads.length > 0 && sortedLeads[0].createdAt) {
            lastActivity = new Date(sortedLeads[0].createdAt);
          }
          
          // Check onboarding progress update time
          if (progress?.updatedAt) {
            const onboardingDate = new Date(progress.updatedAt);
            if (!lastActivity || onboardingDate > lastActivity) {
              lastActivity = onboardingDate;
            }
          }
          
          return {
            ...site,
            leadCount,
            onboardingStatus,
            lastActivity: lastActivity?.toISOString() || null,
          };
        })
      );
      
      // Sort by last activity (most recent first)
      enhancedSites.sort((a, b) => {
        if (!a.lastActivity && !b.lastActivity) return 0;
        if (!a.lastActivity) return 1;
        if (!b.lastActivity) return -1;
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      });
      
      res.json(enhancedSites);
    } catch (error) {
      console.error("Error fetching enhanced sites:", error);
      res.status(500).json({ error: "Failed to fetch enhanced sites" });
    }
  });

  // Get single site
  app.get("/api/admin/sites/:id", async (req, res) => {
    try {
      const site = await storage.getSite(req.params.id);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }
      res.json(site);
    } catch (error) {
      console.error("Error fetching site:", error);
      res.status(500).json({ error: "Failed to fetch site" });
    }
  });

  // Create site
  app.post("/api/admin/sites", async (req, res) => {
    try {
      const result = insertSiteSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid site data", details: result.error.flatten() });
      }

      // Check if subdomain is already taken
      const existingSite = await storage.getSiteBySubdomain(result.data.subdomain);
      if (existingSite) {
        return res.status(409).json({ error: "Subdomain already taken" });
      }

      const site = await storage.createSite(result.data);
      res.status(201).json(site);
    } catch (error) {
      console.error("Error creating site:", error);
      res.status(500).json({ error: "Failed to create site" });
    }
  });

  // Update site
  app.patch("/api/admin/sites/:id", async (req, res) => {
    try {
      const partialSchema = insertSiteSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid site data", details: result.error.flatten() });
      }

      // If subdomain is being changed, check if it's already taken
      if (result.data.subdomain) {
        const existingSite = await storage.getSiteBySubdomain(result.data.subdomain);
        if (existingSite && existingSite.id !== req.params.id) {
          return res.status(409).json({ error: "Subdomain already taken" });
        }
      }

      const site = await storage.updateSite(req.params.id, result.data);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }
      res.json(site);
    } catch (error) {
      console.error("Error updating site:", error);
      res.status(500).json({ error: "Failed to update site" });
    }
  });

  // Delete site
  app.delete("/api/admin/sites/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSite(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Site not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting site:", error);
      res.status(500).json({ error: "Failed to delete site" });
    }
  });

  // Get comprehensive site details for admin view
  app.get("/api/admin/sites/:siteId/details", async (req, res) => {
    try {
      const { siteId } = req.params;
      const site = await storage.getSite(siteId);
      
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }
      
      // Get all related data with fallbacks for missing methods
      let leads: any[] = [];
      let onboardingProgress: any = null;
      let pages: any[] = [];
      let users: any[] = [];
      let photos: any[] = [];
      let testimonials: any[] = [];
      
      try {
        leads = await storage.getLeadsBySiteId(siteId);
      } catch (e) {
        console.error("Error fetching leads:", e);
      }
      
      try {
        onboardingProgress = await storage.getOnboardingProgress(siteId);
      } catch (e) {
        console.error("Error fetching onboarding progress:", e);
      }
      
      try {
        pages = await storage.getPagesBySiteId(siteId);
      } catch (e) {
        console.error("Error fetching pages:", e);
      }
      
      try {
        users = await storage.getTenantUsersBySiteId(siteId);
      } catch (e) {
        console.error("Error fetching users:", e);
      }
      
      try {
        photos = await storage.getSitePhotos(siteId);
      } catch (e) {
        console.error("Error fetching photos:", e);
      }
      
      try {
        testimonials = await storage.getTestimonials(siteId);
      } catch (e) {
        console.error("Error fetching testimonials:", e);
      }
      
      // Sanitize user data - remove passwords
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      
      res.json({
        site,
        leads,
        onboardingProgress,
        pages,
        users: sanitizedUsers,
        photos,
        testimonials
      });
    } catch (error) {
      console.error("Error fetching site details:", error);
      res.status(500).json({ error: "Failed to fetch site details" });
    }
  });

  // Platform Admin: Impersonate tenant admin
  app.post("/api/admin/sites/:siteId/impersonate", async (req, res) => {
    try {
      const { siteId } = req.params;
      const site = await storage.getSite(siteId);
      
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }
      
      // Get or create a default admin user for this site
      let tenantUsers = await storage.getTenantUsersBySiteId(siteId);
      let targetUser = tenantUsers.find(u => u.role === 'admin') || tenantUsers[0];
      
      if (!targetUser) {
        // Create a default admin user if none exists
        const hashedPassword = await bcrypt.hash('impersonate-only', 10);
        targetUser = await storage.createTenantUser({
          siteId,
          email: `admin@${site.subdomain}.local`,
          password: hashedPassword,
          name: 'Site Admin',
          role: 'admin'
        });
      }
      
      // Create a short-lived JWT token for impersonation
      const token = jwt.sign(
        { 
          type: 'impersonate',
          siteId,
          userId: targetUser.id,
          adminEmail: (req as any).user?.claims?.email || 'platform-admin'
        },
        process.env.SESSION_SECRET || 'localblue-secret',
        { expiresIn: '2m' }
      );
      
      // Return the impersonation URL
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      res.json({ 
        impersonateUrl: `${baseUrl}/tenant/${site.subdomain}/impersonate?token=${token}`,
        subdomain: site.subdomain,
        token
      });
    } catch (error) {
      console.error("Error creating impersonation token:", error);
      res.status(500).json({ error: "Failed to create impersonation session" });
    }
  });

  // Preview site by subdomain (for development)
  app.get("/api/preview/:subdomain", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }
      res.json(site);
    } catch (error) {
      console.error("Error fetching site for preview:", error);
      res.status(500).json({ error: "Failed to fetch site" });
    }
  });

  // Get pages for preview site
  app.get("/api/preview/:subdomain/pages/:slug", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }
      const page = await storage.getPageBySiteAndSlug(site.id, req.params.slug);
      if (!page) {
        return res.status(404).json({ error: "Page not found" });
      }
      res.json(page);
    } catch (error) {
      console.error("Error fetching page for preview:", error);
      res.status(500).json({ error: "Failed to fetch page" });
    }
  });

  // --- Users CRUD ---

  // Get all users (optionally filtered by site)
  app.get("/api/admin/users", async (req, res) => {
    try {
      const siteId = req.query.siteId as string | undefined;
      let users;
      
      if (siteId) {
        users = await storage.getTenantUsersBySiteId(siteId);
      } else {
        users = await storage.getAllTenantUsers();
      }
      
      // Remove passwords from response
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get single user
  app.get("/api/admin/users/:id", async (req, res) => {
    try {
      const user = await storage.getTenantUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Create user
  app.post("/api/admin/users", async (req, res) => {
    try {
      const result = insertTenantUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid user data", details: result.error.flatten() });
      }

      // Check if email is already taken
      const existingUser = await storage.getTenantUserByEmail(result.data.email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(result.data.password, SALT_ROUNDS);

      const user = await storage.createTenantUser({
        ...result.data,
        password: hashedPassword,
      });

      const { password, ...sanitizedUser } = user;
      res.status(201).json(sanitizedUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Update user
  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const partialSchema = insertTenantUserSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid user data", details: result.error.flatten() });
      }

      // If email is being changed, check if it's already taken
      if (result.data.email) {
        const existingUser = await storage.getTenantUserByEmail(result.data.email);
        if (existingUser && existingUser.id !== req.params.id) {
          return res.status(409).json({ error: "Email already registered" });
        }
      }

      // If password is being updated, hash it
      let updateData = { ...result.data };
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
      }

      const user = await storage.updateTenantUser(req.params.id, updateData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTenantUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // ============================================
  // Public Signup Route (for contractors)
  // ============================================

  app.post("/api/signup", async (req, res) => {
    try {
      const result = signupSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid signup data", details: result.error.flatten() });
      }

      const { email, password, businessName } = result.data;

      // Check if email is already taken
      const existingUser = await storage.getTenantUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already registered" });
      }

      // Generate subdomain from business name
      let subdomain = generateSubdomain(businessName);
      
      // Ensure subdomain is not empty
      if (!subdomain) {
        subdomain = "site";
      }

      // Check if subdomain exists, add suffix if needed
      let existingSite = await storage.getSiteBySubdomain(subdomain);
      while (existingSite) {
        subdomain = `${generateSubdomain(businessName)}-${generateRandomSuffix()}`;
        existingSite = await storage.getSiteBySubdomain(subdomain);
      }

      // Create the site
      const site = await storage.createSite({
        subdomain,
        businessName,
        brandColor: "#2563EB",
        services: [],
        isPublished: false,
      });

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await storage.createTenantUser({
        email,
        password: hashedPassword,
        siteId: site.id,
      });

      // Set session so user is logged in
      req.session.userId = user.id;
      req.session.siteId = site.id;

      const { password: _, ...sanitizedUser } = user;
      res.status(201).json({ user: sanitizedUser, site });
    } catch (error) {
      console.error("Error during signup:", error);
      res.status(500).json({ error: "Signup failed" });
    }
  });

  // ============================================
  // Tenant-scoped API Routes
  // ============================================

  // Get current tenant site info (requires tenant context)
  app.get("/api/site", requireTenant, (req, res) => {
    const { id, subdomain, businessName, brandColor, services, isPublished, customDomain } = req.site!;
    res.json({ id, subdomain, businessName, brandColor, services, isPublished, customDomain });
  });

  // Get page content by slug (public route - requires tenant but not auth)
  app.get("/api/site/pages/:slug", requireTenant, async (req, res) => {
    try {
      const page = await storage.getPageBySiteAndSlug(req.site!.id, req.params.slug as string);
      if (!page) {
        return res.status(404).json({ error: "Page not found" });
      }
      res.json(page);
    } catch (error) {
      console.error("Error fetching page:", error);
      res.status(500).json({ error: "Failed to fetch page" });
    }
  });

  // Simple in-memory rate limiter for lead submissions
  const leadRateLimit = new Map<string, { count: number; resetTime: number }>();
  const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  const RATE_LIMIT_MAX = 5; // 5 submissions per minute per IP

  // Submit lead/contact form (public route - requires tenant but not auth)
  app.post("/api/site/leads", requireTenant, async (req, res) => {
    try {
      // Rate limiting
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      const rateData = leadRateLimit.get(clientIp);
      
      if (rateData) {
        if (now < rateData.resetTime) {
          if (rateData.count >= RATE_LIMIT_MAX) {
            return res.status(429).json({ error: "Too many requests. Please try again later." });
          }
          rateData.count++;
        } else {
          leadRateLimit.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        }
      } else {
        leadRateLimit.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }

      // Cleanup old entries periodically
      if (leadRateLimit.size > 1000) {
        const entries = Array.from(leadRateLimit.entries());
        for (const [ip, data] of entries) {
          if (now > data.resetTime) {
            leadRateLimit.delete(ip);
          }
        }
      }

      // Server-side honeypot check - reject if the website field is filled
      if (req.body.website) {
        // Silently succeed to not tip off bots
        return res.status(201).json({ success: true, id: 0 });
      }

      const leadData = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        message: req.body.message,
        siteId: req.site!.id,
      };

      const result = insertLeadSchema.safeParse(leadData);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid lead data", details: result.error.flatten() });
      }

      const lead = await storage.createLead(result.data);
      
      // Send email notification to the contractor (non-blocking)
      const site = req.site!;
      if (site.email) {
        sendLeadNotification({
          businessName: site.businessName,
          businessEmail: site.email,
          leadName: lead.name,
          leadEmail: lead.email,
          leadPhone: lead.phone || undefined,
          leadMessage: lead.message || '',
        }).catch(err => console.error('Failed to send lead notification:', err));
      }
      
      res.status(201).json({ success: true, id: lead.id });
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(500).json({ error: "Failed to submit contact form" });
    }
  });

  // Get public testimonials (public route - requires tenant but not auth)
  app.get("/api/site/testimonials", requireTenant, async (req, res) => {
    try {
      const siteTestimonials = await storage.getTestimonials(req.site!.id);
      res.json(siteTestimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ error: "Failed to fetch testimonials" });
    }
  });

  // Health check / tenant detection endpoint
  app.get("/api/tenant", (req, res) => {
    if (req.site) {
      res.json({
        found: true,
        site: {
          id: req.site.id,
          subdomain: req.site.subdomain,
          businessName: req.site.businessName,
          brandColor: req.site.brandColor,
          isPublished: req.site.isPublished,
        },
        isTenantAdmin: req.isTenantAdmin || false,
      });
    } else {
      res.json({ found: false, message: "No tenant detected for this hostname" });
    }
  });

  // ============================================
  // Public Chatbot API Routes
  // ============================================

  // Chat with AI assistant (streaming SSE)
  app.post("/api/site/chat", requireTenant, async (req, res) => {
    try {
      const { message, visitorId, history = [] } = req.body;
      const site = req.site!;

      if (!message || !visitorId) {
        return res.status(400).json({ error: "Message and visitorId are required" });
      }

      // Get or create conversation
      let conversation = await storage.getChatbotConversation(site.id, visitorId);
      if (!conversation) {
        conversation = await storage.createChatbotConversation({
          siteId: site.id,
          visitorId,
          messages: [],
          leadCaptured: false,
        });
      }

      // Build context from site data
      const tradeTemplate = site.tradeType ? getTradeTemplate(site.tradeType) : null;
      const services = site.services || [];
      const faqs = site.chatbotFaqs || tradeTemplate?.commonFaqs || [];
      
      const systemPrompt = `You are a friendly, professional virtual assistant for ${site.businessName}, a ${tradeTemplate?.name || 'contractor'} business.

BUSINESS INFORMATION:
- Business Name: ${site.businessName}
- Services: ${services.join(", ") || "General contracting services"}
- Service Area: ${site.serviceArea || "Local area"}
- Years in Business: ${site.yearsInBusiness || "Many years"}
- Phone: ${site.phone || "Contact us for details"}
${site.ownerName ? `- Owner: ${site.ownerName}` : ""}
${site.businessDescription ? `- About: ${site.businessDescription}` : ""}

CERTIFICATIONS & CREDENTIALS:
${(site.certifications || tradeTemplate?.defaultCertifications || []).join(", ")}

FREQUENTLY ASKED QUESTIONS:
${faqs.map((faq: { question: string; answer: string }) => `Q: ${faq.question}\nA: ${faq.answer}`).join("\n\n")}

YOUR ROLE:
1. Be helpful, friendly, and professional
2. Answer questions about services, pricing (provide general estimates only), and service areas
3. Encourage visitors to call or book an appointment for specific quotes
4. Naturally try to collect lead information (name, email, phone) during conversation
5. If someone asks for a quote, explain that you can provide general estimates but encourage them to call or schedule a consultation for accurate pricing
6. Highlight the business's experience, certifications, and quality of service
7. Keep responses concise and conversational (2-3 sentences max unless more detail is needed)
8. If you don't know something specific, encourage them to call for more details

IMPORTANT:
- Never make up specific pricing unless it's mentioned in the business information
- Always push toward scheduling an appointment or calling
- Be enthusiastic about the business and its services
- If someone seems ready to book, prompt them to share their contact info`;

      // Build messages for API
      const apiMessages = [
        ...history.slice(-10).map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: message },
      ];

      // Set up SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response from Anthropic
      let fullResponse = "";
      
      const stream = await anthropic.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: systemPrompt,
        messages: apiMessages,
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const text = event.delta.text;
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }

      // Update conversation with new messages
      const existingMessages = (conversation.messages || []) as Array<{role: string, content: string, timestamp: string}>;
      const updatedMessages = [
        ...existingMessages,
        { role: "user", content: message, timestamp: new Date().toISOString() },
        { role: "assistant", content: fullResponse, timestamp: new Date().toISOString() },
      ];

      await storage.updateChatbotConversation(conversation.id, {
        messages: updatedMessages,
      });

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("Chat error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to process chat message" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "An error occurred" })}\n\n`);
        res.end();
      }
    }
  });

  // Capture lead from chat
  app.post("/api/site/chat/lead", requireTenant, async (req, res) => {
    try {
      const { visitorId, name, email, phone } = req.body;
      const site = req.site!;

      if (!visitorId || !email) {
        return res.status(400).json({ error: "visitorId and email are required" });
      }

      // Update conversation with lead info
      const conversation = await storage.getChatbotConversation(site.id, visitorId);
      if (conversation) {
        await storage.updateChatbotConversation(conversation.id, {
          leadCaptured: true,
          leadName: name || null,
          leadEmail: email,
          leadPhone: phone || null,
        });
      }

      // Also create a lead record
      await storage.createLead({
        siteId: site.id,
        name: name || "Chat Visitor",
        email,
        phone: phone || null,
        message: "Lead captured via chatbot conversation",
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Lead capture error:", error);
      res.status(500).json({ error: "Failed to capture lead" });
    }
  });

  // Get chat history for a visitor
  app.get("/api/site/chat/history", requireTenant, async (req, res) => {
    try {
      const visitorId = req.query.visitorId as string;
      const site = req.site!;

      if (!visitorId) {
        return res.status(400).json({ error: "visitorId is required" });
      }

      const conversation = await storage.getChatbotConversation(site.id, visitorId);
      if (!conversation) {
        return res.json({ messages: [] });
      }

      res.json({ 
        messages: conversation.messages || [],
        leadCaptured: conversation.leadCaptured,
      });
    } catch (error) {
      console.error("Chat history error:", error);
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  // ============================================
  // Tenant Admin API Routes
  // ============================================

  // Tenant: Handle impersonation login
  app.get("/api/tenant/impersonate", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: "Missing token" });
      }
      
      try {
        const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'localblue-secret') as {
          type: string;
          siteId: string;
          userId: string;
          adminEmail: string;
        };
        
        if (decoded.type !== 'impersonate') {
          return res.status(400).json({ error: "Invalid token type" });
        }
        
        // Set up session like a regular login
        req.session.userId = decoded.userId;
        req.session.siteId = decoded.siteId;
        req.session.isImpersonating = true;
        req.session.impersonatedBy = decoded.adminEmail;
        
        // Get the site to redirect to proper tenant admin
        const site = await storage.getSite(decoded.siteId);
        if (!site) {
          return res.status(404).json({ error: "Site not found" });
        }
        
        res.json({ 
          success: true, 
          message: "Impersonation session created",
          siteId: decoded.siteId,
          subdomain: site.subdomain
        });
      } catch (jwtError) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
    } catch (error) {
      console.error("Impersonation error:", error);
      res.status(500).json({ error: "Impersonation failed" });
    }
  });

  // Tenant Auth: Login
  app.post("/api/tenant/auth/login", requireTenantAdmin, async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid credentials format", details: result.error.flatten() });
      }

      const { email, password } = result.data;

      // Find user by email
      const user = await storage.getTenantUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify user belongs to the detected site
      if (user.siteId !== req.site!.id) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Set session
      req.session.userId = user.id;
      req.session.siteId = user.siteId!;

      const { password: _, ...sanitizedUser } = user;
      res.json({ user: sanitizedUser });
    } catch (error) {
      console.error("Error during tenant login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Tenant Auth: Logout
  app.post("/api/tenant/auth/logout", requireTenantAdmin, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  // Tenant Auth: Get current user
  app.get("/api/tenant/auth/me", requireTenantAdmin, requireTenantAuth, async (req, res) => {
    try {
      const user = await storage.getTenantUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password, ...sanitizedUser } = user;
      res.json({ user: sanitizedUser });
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Tenant Settings: Get settings
  app.get("/api/tenant/settings", requireTenantAdmin, requireTenantAuth, (req, res) => {
    const { id, subdomain, businessName, brandColor, services, isPublished, customDomain } = req.site!;
    res.json({ id, subdomain, businessName, brandColor, services, isPublished, customDomain });
  });

  // Tenant Settings: Update settings
  app.patch("/api/tenant/settings", requireTenantAdmin, requireTenantAuth, async (req, res) => {
    try {
      // Only allow updating certain fields (not subdomain or id)
      const allowedFields = ["businessName", "brandColor", "services", "isPublished"];
      const updateData: Record<string, any> = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const updatedSite = await storage.updateSite(req.site!.id, updateData);
      if (!updatedSite) {
        return res.status(404).json({ error: "Site not found" });
      }

      const { id, subdomain, businessName, brandColor, services, isPublished, customDomain } = updatedSite;
      res.json({ id, subdomain, businessName, brandColor, services, isPublished, customDomain });
    } catch (error) {
      console.error("Error updating tenant settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Tenant Users: Get users belonging to this tenant
  app.get("/api/tenant/users", requireTenantAdmin, requireTenantAuth, async (req, res) => {
    try {
      const users = await storage.getTenantUsersBySiteId(req.site!.id);
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching tenant users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Tenant Users: Create a user for this tenant
  app.post("/api/tenant/users", requireTenantAdmin, requireTenantAuth, async (req, res) => {
    try {
      const result = insertTenantUserSchema.safeParse({
        ...req.body,
        siteId: req.site!.id, // Force the user to belong to this tenant
      });
      
      if (!result.success) {
        return res.status(400).json({ error: "Invalid user data", details: result.error.flatten() });
      }

      // Check if email is already taken
      const existingUser = await storage.getTenantUserByEmail(result.data.email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(result.data.password, SALT_ROUNDS);

      const user = await storage.createTenantUser({
        ...result.data,
        password: hashedPassword,
      });

      const { password, ...sanitizedUser } = user;
      res.status(201).json(sanitizedUser);
    } catch (error) {
      console.error("Error creating tenant user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // ============================================
  // Tenant CMS API Routes
  // ============================================

  // Tenant Pages: Get all pages for this tenant
  app.get("/api/tenant/pages", requireTenantAdmin, requireTenantAuth, async (req, res) => {
    try {
      const pages = await storage.getPagesBySiteId(req.site!.id);
      res.json(pages);
    } catch (error) {
      console.error("Error fetching tenant pages:", error);
      res.status(500).json({ error: "Failed to fetch pages" });
    }
  });

  // Tenant Pages: Get a single page by slug
  app.get("/api/tenant/pages/:slug", requireTenantAdmin, requireTenantAuth, async (req, res) => {
    try {
      const page = await storage.getPageBySiteAndSlug(req.site!.id, req.params.slug as string);
      if (!page) {
        return res.status(404).json({ error: "Page not found" });
      }
      res.json(page);
    } catch (error) {
      console.error("Error fetching tenant page:", error);
      res.status(500).json({ error: "Failed to fetch page" });
    }
  });

  // Tenant Pages: Update a page by slug
  app.patch("/api/tenant/pages/:slug", requireTenantAdmin, requireTenantAuth, async (req, res) => {
    try {
      const page = await storage.getPageBySiteAndSlug(req.site!.id, req.params.slug as string);
      if (!page) {
        return res.status(404).json({ error: "Page not found" });
      }

      const { title, content } = req.body;
      const updateData: { title?: string; content?: Record<string, any> } = {};
      
      if (title !== undefined) {
        updateData.title = title;
      }
      if (content !== undefined) {
        updateData.content = content;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const updatedPage = await storage.updatePage(page.id, updateData);
      res.json(updatedPage);
    } catch (error) {
      console.error("Error updating tenant page:", error);
      res.status(500).json({ error: "Failed to update page" });
    }
  });

  // Tenant Leads: Get all leads for this tenant
  app.get("/api/tenant/leads", requireTenantAdmin, requireTenantAuth, async (req, res) => {
    try {
      const leads = await storage.getLeadsBySiteId(req.site!.id);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching tenant leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // ============================================
  // Tenant Domain & Publishing API Routes
  // ============================================

  const domainSchema = z.object({
    customDomain: z.string()
      .transform(val => val.trim().toLowerCase())
      .refine(val => val === "" || /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/.test(val), {
        message: "Please enter a valid domain (e.g., www.yourdomain.com)",
      })
      .nullable(),
  });

  // Update custom domain
  app.patch("/api/tenant/settings/domain", requireTenantAdmin, requireTenantAuth, async (req, res) => {
    try {
      const result = domainSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid domain format", details: result.error.flatten() });
      }

      const { customDomain } = result.data;
      const normalizedDomain = customDomain || null;

      // Check if domain is already in use by another site
      if (normalizedDomain) {
        const existingSite = await storage.getSiteByCustomDomain(normalizedDomain);
        if (existingSite && existingSite.id !== req.site!.id) {
          return res.status(409).json({ error: "This domain is already connected to another site" });
        }
      }

      const updatedSite = await storage.updateSite(req.site!.id, { customDomain: normalizedDomain });
      if (!updatedSite) {
        return res.status(404).json({ error: "Site not found" });
      }

      const { id, subdomain, businessName, brandColor, services, isPublished, customDomain: domain } = updatedSite;
      res.json({ id, subdomain, businessName, brandColor, services, isPublished, customDomain: domain });
    } catch (error) {
      console.error("Error updating custom domain:", error);
      res.status(500).json({ error: "Failed to update domain" });
    }
  });

  // Toggle publish status
  app.post("/api/tenant/publish", requireTenantAdmin, requireTenantAuth, async (req, res) => {
    try {
      const currentSite = req.site!;
      const newPublishStatus = !currentSite.isPublished;

      const updatedSite = await storage.updateSite(currentSite.id, { isPublished: newPublishStatus });
      if (!updatedSite) {
        return res.status(404).json({ error: "Site not found" });
      }

      const { id, subdomain, businessName, brandColor, services, isPublished, customDomain } = updatedSite;
      res.json({ 
        id, subdomain, businessName, brandColor, services, isPublished, customDomain,
        message: isPublished ? "Site published successfully!" : "Site unpublished successfully!"
      });
    } catch (error) {
      console.error("Error toggling publish status:", error);
      res.status(500).json({ error: "Failed to update publish status" });
    }
  });

  // ============================================
  // Onboarding API Routes
  // ============================================

  const ENHANCED_ONBOARDING_PROMPT = `You are an expert website consultant for LocalBlue.ai, helping contractors create spectacular, best-in-class websites. Your goal is to have a thorough 5-15 minute conversation to deeply understand their business and create a truly personalized website.

## CONVERSATION PHASES
You must progress through these phases one at a time, asking only ONE question per response:

### Phase 1: WELCOME (1 message)
- Warmly greet them and mention their business name
- Ask about their PRIMARY trade/specialty (e.g., "What's your main specialty - are you primarily a plumber, electrician, general contractor, roofer, HVAC tech, painter, or landscaper?")

### Phase 2: TRADE_DETECTION (1-2 messages)
- Based on their answer, confirm their trade type
- Ask what specific services they offer within that trade (e.g., for plumbing: "Do you do emergency repairs, water heaters, drain cleaning, remodeling, or all of the above?")

### Phase 3: SERVICES (2-3 messages)
- Deep dive into their service offerings
- Ask about any specialty services that set them apart
- Ask if they serve residential, commercial, or both

### Phase 4: STORY (2-3 messages)
- Ask how long they've been in business
- Ask about their background/story (how they got started)
- Ask about the owner's name and role

### Phase 5: DIFFERENTIATORS (2-3 messages)
- Ask what makes them different from competitors
- Ask about certifications, awards, or special qualifications
- Ask about guarantees or warranties they offer
- Ask about their response time (24/7 emergency? same-day service?)

### Phase 6: SERVICE_AREA (1-2 messages)
- Ask about the cities/areas they serve
- Ask about their service radius

### Phase 7: CONTACT_INFO (1-2 messages)
- Ask for their business phone number
- Ask for their business email (if different from sign-up)
- Ask for their business address (for local SEO)

### Phase 8: PHOTOS (1 message)
- Encourage them to upload photos if they have any
- Explain we'll use professional stock imagery matched to their trade if they don't have photos
- Tell them they can always add photos later

### Phase 9: STYLE (1-2 messages)
- Present 4 style options:
  * Professional & Clean - Modern, trustworthy, clean lines
  * Bold & Modern - Strong, confident, striking contrasts
  * Warm & Friendly - Approachable, welcoming, great for family businesses
  * Luxury & Elegant - Sophisticated, premium positioning
- Ask which best represents their brand

### Phase 10: PAGES (1-2 messages)
- Present page options they can include:
  * Home (required), Services (required), Contact (required)
  * About Us, Project Gallery, Testimonials, FAQ, Service Area Map
  * Get a Quote (calculator), Schedule Service (booking)
  * Financing Options, Blog
- Ask which pages they want

### Phase 11: REVIEW (1 message)
- Give a brief, conversational summary (2-3 sentences) of what makes their business special
- Ask if you have everything right and if they're ready to build their site
- When they confirm, include "READY_TO_GENERATE" in your response

## CRITICAL GUIDELINES

1. **ONE QUESTION AT A TIME** - Never ask multiple questions in one message
2. **BE CONVERSATIONAL** - React to their answers, show genuine interest
3. **ASK FOLLOW-UPS** - If their answer is vague, dig deeper
4. **ENCOURAGE DETAIL** - The more info you gather, the better the website
5. **BE SUPPORTIVE** - Validate their business choices and expertise
6. **KEEP IT NATURAL** - Don't sound scripted, adapt to their communication style
7. **SHORT RESPONSES** - Keep responses to 2-4 sentences max
8. **NO TECHNICAL FORMATTING** - Never use markdown like **bold**, bullet lists, or structured data in your visible response. Write in natural, flowing sentences that feel human.
9. **TRACK PROGRESS** - At the very end of your response, on a new line, include a progress tracker:
   <!--PROGRESS:{"phase":"PHASE_NAME","collected":{"key":"value"}}-->
   This is for internal tracking only and will not be shown to users.

## EXAMPLES OF GOOD RESPONSES

"That's great that you specialize in emergency plumbing! Being available 24/7 is a huge selling point. Do you also handle routine maintenance and installations, or do you focus mainly on emergency repairs?"

"Love that your dad started the business 30 years ago and now you're carrying on the tradition - that's a powerful story! What would you say is the #1 thing that sets your company apart from other electricians in the area?"

"A family-owned business with 4th generation craftsmen - that's incredible and definitely something we should highlight prominently on your site! What certifications or special training does your team have?"

## EXAMPLE OF GOOD REVIEW SUMMARY

"So I've got a great picture of Elite Plumbing - Tom founded it 20 years ago and you've built a solid reputation for 24/7 emergency service, water heaters, and bathroom remodels across the Chicagoland area. Your 2-year workmanship guarantee really sets you apart. Does that all sound right? If so, I'm ready to build your site!"

Start the conversation now.`;

  // Onboarding: Get current session info
  app.get("/api/onboarding/session", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.siteId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getTenantUser(req.session.userId);
      const site = await storage.getSite(req.session.siteId);

      if (!user || !site) {
        return res.status(404).json({ error: "User or site not found" });
      }

      // Get or create conversation for this site
      let conversation = await storage.getConversationBySiteId(site.id);
      let messages: { role: string; content: string }[] = [];

      if (conversation) {
        const dbMessages = await storage.getMessagesByConversation(conversation.id);
        messages = dbMessages.map((m) => ({ role: m.role, content: m.content }));
      }

      // Get or create onboarding progress
      let progress = await storage.getOnboardingProgress(site.id);
      if (!progress) {
        progress = await storage.createOnboardingProgress({
          siteId: site.id,
          currentPhase: "welcome",
          collectedData: {},
          completedPhases: [],
        });
      }

      const { password: _, ...sanitizedUser } = user;
      res.json({ user: sanitizedUser, site, messages, progress });
    } catch (error) {
      console.error("Error fetching onboarding session:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  // Onboarding: Chat with AI (streaming)
  app.post("/api/onboarding/chat", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.siteId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { message } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      const site = await storage.getSite(req.session.siteId);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }

      // Get or create conversation
      let conversation = await storage.getConversationBySiteId(site.id);
      if (!conversation) {
        conversation = await storage.createConversation("Onboarding", site.id);
      }

      // Save user message
      await storage.createMessage(conversation.id, "user", message);

      // Get conversation history
      const dbMessages = await storage.getMessagesByConversation(conversation.id);
      const chatMessages = dbMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Get onboarding progress to provide context
      let progress = await storage.getOnboardingProgress(site.id);
      if (!progress) {
        progress = await storage.createOnboardingProgress({
          siteId: site.id,
          currentPhase: "welcome",
          collectedData: {},
          completedPhases: [],
        });
      }

      // Build context for the AI including business name and any collected data
      const contextAddition = `
## CURRENT CONTEXT
- Business Name: ${site.businessName}
- Current Phase: ${progress.currentPhase}
- Already Collected: ${JSON.stringify(progress.collectedData || {})}

Continue the conversation from here.`;

      // Stream response from Anthropic
      const stream = anthropic.messages.stream({
        model: "claude-opus-4-5",
        max_tokens: 1024,
        system: ENHANCED_ONBOARDING_PROMPT + contextAddition,
        messages: chatMessages,
      });

      let fullResponse = "";

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const content = event.delta.text;
          if (content) {
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
      }

      // Save assistant message
      await storage.createMessage(conversation.id, "assistant", fullResponse);

      // Parse progress from AI response if present
      const progressMatch = fullResponse.match(/<!--PROGRESS:({.*?})-->/);
      if (progressMatch) {
        try {
          const progressData = JSON.parse(progressMatch[1]);
          const existingData = progress.collectedData || {};
          const newCollectedData = { ...existingData, ...progressData.collected };
          
          // Map AI phase names to our schema phase names
          const phaseMapping: Record<string, string> = {
            "WELCOME": "welcome",
            "TRADE_DETECTION": "trade_detection",
            "SERVICES": "services",
            "STORY": "story",
            "DIFFERENTIATORS": "differentiators",
            "SERVICE_AREA": "service_area",
            "CONTACT_INFO": "business_basics",
            "PHOTOS": "photos",
            "STYLE": "style",
            "PAGES": "pages",
            "REVIEW": "review",
          };
          
          const mappedPhase = phaseMapping[progressData.phase] || progressData.phase?.toLowerCase() || progress.currentPhase;
          
          await storage.updateOnboardingProgress(site.id, {
            currentPhase: mappedPhase as any,
            collectedData: newCollectedData,
          });
        } catch (e) {
          console.error("Failed to parse progress data:", e);
        }
      }

      // Check if ready to generate
      const readyToGenerate = fullResponse.includes("READY_TO_GENERATE");
      
      // Get updated progress to send back
      const updatedProgress = await storage.getOnboardingProgress(site.id);
      
      // Get updated site data to reflect any changes from extraction
      const updatedSite = await storage.getSite(site.id);

      // Merge site defaults with collected data (collected data takes priority)
      const progressData = (updatedProgress?.collectedData || {}) as Record<string, any>;
      const mergedData = {
        // Start with site defaults
        businessName: updatedSite?.businessName,
        tradeType: updatedSite?.tradeType,
        services: updatedSite?.services,
        tagline: updatedSite?.tagline,
        ownerStory: updatedSite?.ownerStory,
        serviceArea: updatedSite?.serviceArea,
        stylePreference: updatedSite?.stylePreference,
        selectedPages: updatedSite?.selectedPages,
        phone: updatedSite?.phone,
        email: updatedSite?.email,
        address: updatedSite?.address,
        // Then override with progress collected data (which has the latest from chat)
        ...progressData,
      };

      res.write(`data: ${JSON.stringify({ 
        done: true, 
        readyToGenerate,
        phase: updatedProgress?.currentPhase,
        collectedData: mergedData,
        progress: updatedProgress 
      })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in onboarding chat:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to get response" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process message" });
      }
    }
  });

  // Onboarding: Generate site from conversation
  app.post("/api/onboarding/generate", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.siteId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const site = await storage.getSite(req.session.siteId);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }

      // Get conversation
      const conversation = await storage.getConversationBySiteId(site.id);
      if (!conversation) {
        return res.status(400).json({ error: "No conversation found" });
      }

      const dbMessages = await storage.getMessagesByConversation(conversation.id);
      const conversationText = dbMessages.map((m) => `${m.role}: ${m.content}`).join("\n");

      // Enhanced AI extraction with comprehensive data
      const extractionPrompt = `You are a data extraction assistant for contractor websites. Extract comprehensive information from the conversation and return it as JSON.

IMPORTANT: 
- tradeType MUST be one of: general_contractor, plumber, electrician, roofer, hvac, painter, landscaper
- stylePreference MUST be one of: professional, bold, warm, luxury
- selectedPages should include page IDs from: home, about, services, gallery, testimonials, faq, service-area, contact, quote, schedule, financing, blog
- Generate a compelling tagline if none was explicitly mentioned
- Extract years in business as a number

Return this exact JSON structure:
{
  "tradeType": "one of the valid trade types",
  "services": ["list", "of", "specific", "services"],
  "serviceArea": "cities/areas they serve",
  "businessDescription": "compelling description of the business (2-3 sentences)",
  "tagline": "catchy tagline for the hero section",
  "ownerName": "owner's name if mentioned",
  "ownerStory": "the story of how they started/their background",
  "yearsInBusiness": 0,
  "uniqueSellingPoints": ["what makes them different", "from competitors"],
  "certifications": ["licenses", "certifications", "awards"],
  "phone": "business phone if mentioned",
  "email": "business email if mentioned",
  "address": "business address if mentioned",
  "stylePreference": "professional",
  "selectedPages": ["home", "services", "contact", "about", "gallery", "testimonials", "faq"]
}

Only return valid JSON, nothing else.`;

      const extractionResponse = await anthropic.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 2048,
        system: extractionPrompt,
        messages: [
          {
            role: "user",
            content: `Extract comprehensive business information from this onboarding conversation:\n\n${conversationText}`,
          },
        ],
      });

      // Parse the extracted data
      let extractedData: {
        tradeType?: TradeType;
        services?: string[];
        serviceArea?: string;
        businessDescription?: string;
        tagline?: string;
        ownerName?: string;
        ownerStory?: string;
        yearsInBusiness?: number;
        uniqueSellingPoints?: string[];
        certifications?: string[];
        phone?: string;
        email?: string;
        address?: string;
        stylePreference?: StylePreference;
        selectedPages?: string[];
      };

      try {
        let responseText = extractionResponse.content[0].type === "text" 
          ? extractionResponse.content[0].text 
          : "";
        // Strip markdown code blocks if present
        responseText = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        console.log("Extraction response:", responseText.substring(0, 500));
        extractedData = JSON.parse(responseText);
        console.log("Successfully extracted data:", JSON.stringify(extractedData, null, 2));
      } catch (parseError) {
        console.error("Failed to parse extraction response:", parseError);
        extractedData = {
          tradeType: "general_contractor",
          services: [],
          serviceArea: "",
          businessDescription: "",
          tagline: "Quality Work You Can Trust",
          stylePreference: "professional",
          selectedPages: ["home", "services", "contact"],
        };
      }

      // Validate and normalize tradeType
      const validTradeTypes = TRADE_TYPES as readonly string[];
      const tradeType: TradeType = validTradeTypes.includes(extractedData.tradeType || "")
        ? (extractedData.tradeType as TradeType)
        : "general_contractor";

      // Get trade template
      const tradeTemplate = getTradeTemplate(tradeType);

      // Validate and normalize stylePreference
      const validStyles = ["professional", "bold", "warm", "luxury"];
      const stylePreference: StylePreference = validStyles.includes(extractedData.stylePreference || "")
        ? (extractedData.stylePreference as StylePreference)
        : "professional";

      // Get style template
      const styleTemplate = getStyleTemplate(stylePreference);

      // Merge extracted services with trade default services
      const extractedServices = extractedData.services || [];
      const mergedServices = Array.from(new Set([...extractedServices, ...tradeTemplate.defaultServices]));

      // RICH CONTENT GENERATION - Create compelling marketing copy using AI
      const contentGenerationPrompt = `You are an elite website copywriter specializing in contractor and home service businesses. Generate compelling, specific, and persuasive website content that will convert visitors into customers.

BUSINESS DETAILS:
- Business Name: ${site.businessName}
- Trade: ${tradeType.replace(/_/g, ' ')}
- Location: ${extractedData.serviceArea || 'Local area'}
- Services: ${mergedServices.join(', ')}
- Years in Business: ${extractedData.yearsInBusiness || 'Established'}
- Owner: ${extractedData.ownerName || 'Owner'}
- Story: ${extractedData.ownerStory || 'Family-owned business'}
- Differentiators: ${(extractedData.uniqueSellingPoints || []).join(', ')}
- Certifications: ${(extractedData.certifications || []).join(', ')}

STYLE: ${stylePreference} (${stylePreference === 'professional' ? 'trustworthy, clean, authoritative' : stylePreference === 'bold' ? 'confident, energetic, modern' : stylePreference === 'warm' ? 'friendly, approachable, family-focused' : 'premium, sophisticated, high-end'})

Generate the following content as JSON:

{
  "heroHeadline": "A powerful, specific headline (not generic - reference their actual specialty or location)",
  "heroSubheadline": "Compelling subheadline that highlights their main differentiator or promise",
  "heroDescription": "2-3 sentences expanding on their value proposition - be specific about what they do and where",
  "aboutSectionTitle": "Creative title for About section (not just 'About Us')",
  "aboutContent": "3-4 compelling sentences about the business, weaving in their story, experience, and values. Make it personal and authentic.",
  "whyChooseUsTitle": "Creative section title",
  "serviceDescriptions": {
    ${mergedServices.slice(0, 8).map(s => `"${s}": "A specific, compelling 2-sentence description of this service - mention real benefits and outcomes"`).join(',\n    ')}
  },
  "trustStatements": [
    "Four compelling trust statements/value props that highlight real differentiators",
    "Each should be specific to this business, not generic",
    "Reference real credentials, experience, or guarantees",
    "Make customers feel confident choosing this business"
  ],
  "ctaPrimary": "Primary call-to-action button text",
  "ctaSecondary": "Secondary CTA text",
  "serviceAreaDescription": "Compelling description of their service area coverage",
  "testimonialPrompt": "What satisfied customers would say about this business (2 example testimonials with realistic details)"
}

CRITICAL RULES:
1. NEVER use generic phrases like "quality work", "professional service", "tailored to your needs"
2. BE SPECIFIC - mention the actual location, actual services, actual experience
3. Write like a premium agency would - every word should earn its place
4. Match the style preference - professional feels authoritative, warm feels friendly, luxury feels exclusive
5. Reference their specific differentiators and story
6. Create urgency and build trust simultaneously

Return ONLY valid JSON.`;

      let richContent: {
        heroHeadline?: string;
        heroSubheadline?: string;
        heroDescription?: string;
        aboutSectionTitle?: string;
        aboutContent?: string;
        whyChooseUsTitle?: string;
        serviceDescriptions?: Record<string, string>;
        trustStatements?: string[];
        ctaPrimary?: string;
        ctaSecondary?: string;
        serviceAreaDescription?: string;
        testimonialPrompt?: string;
      } = {};

      try {
        const contentResponse = await anthropic.messages.create({
          model: "claude-opus-4-5",
          max_tokens: 4096,
          system: contentGenerationPrompt,
          messages: [
            {
              role: "user",
              content: `Generate rich, compelling website content for ${site.businessName}.`,
            },
          ],
        });

        let contentText = contentResponse.content[0].type === "text"
          ? contentResponse.content[0].text
          : "";
        // Strip markdown code blocks if present
        contentText = contentText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        console.log("Rich content response:", contentText.substring(0, 500));
        richContent = JSON.parse(contentText);
        console.log("Successfully generated rich content with headline:", richContent.heroHeadline);
      } catch (contentError) {
        console.error("Failed to generate rich content:", contentError);
        // Fall back to basic content
        richContent = {
          heroHeadline: extractedData.tagline || `${site.businessName} - ${tradeTemplate.name}`,
          heroSubheadline: `Serving ${extractedData.serviceArea || 'Your Local Area'}`,
          heroDescription: extractedData.businessDescription || tradeTemplate.description,
          aboutSectionTitle: `The ${site.businessName} Story`,
          aboutContent: extractedData.ownerStory || `${site.businessName} has been serving the community with dedication and expertise.`,
          whyChooseUsTitle: "Why Homeowners Choose Us",
          serviceDescriptions: {},
          trustStatements: tradeTemplate.trustBadges,
          ctaPrimary: "Get Your Free Quote",
          ctaSecondary: "Call Now",
          serviceAreaDescription: `Proudly serving ${extractedData.serviceArea || 'the local area'}.`,
        };
      }

      // Merge rich content with extracted data
      const finalTagline = richContent.heroHeadline || extractedData.tagline || tradeTemplate.heroTaglines[0];
      const finalDescription = richContent.heroDescription || extractedData.businessDescription || tradeTemplate.description;

      // Merge certifications with trade defaults
      const extractedCertifications = extractedData.certifications || [];
      const mergedCertifications = Array.from(new Set([...extractedCertifications, ...tradeTemplate.defaultCertifications]));

      // Use rich content for tagline
      const tagline = finalTagline;

      // Merge FAQs - use trade defaults and add any custom ones
      const chatbotFaqs = [...tradeTemplate.commonFaqs];

      // Determine which pages to create
      const selectedPages = extractedData.selectedPages?.length 
        ? extractedData.selectedPages 
        : ["home", "services", "contact", "about", "gallery", "testimonials", "faq"];

      // Ensure required pages are included
      const requiredPages = AVAILABLE_PAGES.filter(p => p.required).map(p => p.id);
      const finalPages = Array.from(new Set([...requiredPages, ...selectedPages]));

      // Update site with all extracted and computed fields including rich content
      const updatedSite = await storage.updateSite(site.id, {
        tradeType,
        stylePreference,
        services: mergedServices,
        brandColor: styleTemplate.colors.primary,
        tagline,
        businessDescription: finalDescription,
        serviceArea: extractedData.serviceArea || "",
        yearsInBusiness: extractedData.yearsInBusiness || undefined,
        ownerName: extractedData.ownerName || undefined,
        ownerStory: extractedData.ownerStory || undefined,
        uniqueSellingPoints: extractedData.uniqueSellingPoints || tradeTemplate.trustBadges,
        certifications: mergedCertifications,
        phone: extractedData.phone || undefined,
        email: extractedData.email || undefined,
        address: extractedData.address || undefined,
        selectedPages: finalPages,
        enableChatbot: true,
        chatbotFaqs,
        enableProjectGallery: finalPages.includes("gallery"),
        isPublished: true,
      });

      // Generate page content based on selected pages using rich AI-generated content
      const pageGenerators: Record<string, () => { slug: string; title: string; content: Record<string, any> }> = {
        home: () => ({
          slug: "home",
          title: "Home",
          content: {
            heroHeadline: richContent.heroHeadline || tagline,
            heroSubheadline: richContent.heroSubheadline || `Serving ${extractedData.serviceArea || "Your Local Area"}`,
            heroDescription: richContent.heroDescription || finalDescription,
            featuredServices: mergedServices.slice(0, 6),
            serviceDescriptions: richContent.serviceDescriptions || {},
            trustStatements: richContent.trustStatements || tradeTemplate.trustBadges,
            ctaPrimary: richContent.ctaPrimary || "Get Your Free Quote",
            ctaSecondary: richContent.ctaSecondary || "Call Now",
            ctaPhone: extractedData.phone || "",
            whyChooseUsTitle: richContent.whyChooseUsTitle || "Why Choose Us",
          },
        }),
        about: () => ({
          slug: "about",
          title: richContent.aboutSectionTitle || "About Us",
          content: {
            sectionTitle: richContent.aboutSectionTitle || `The ${site.businessName} Story`,
            companyStory: richContent.aboutContent || extractedData.ownerStory || `${site.businessName} has been proudly serving ${extractedData.serviceArea || "the local community"}.`,
            ownerName: extractedData.ownerName || "",
            yearsInBusiness: extractedData.yearsInBusiness || 0,
            uniqueSellingPoints: extractedData.uniqueSellingPoints || [],
            certifications: mergedCertifications,
            serviceAreaDescription: richContent.serviceAreaDescription || "",
          },
        }),
        services: () => ({
          slug: "services",
          title: "Our Services",
          content: {
            servicesList: mergedServices.map((service, index) => ({
              name: service,
              description: richContent.serviceDescriptions?.[service] || `Expert ${service.toLowerCase()} solutions designed for lasting results.`,
              icon: tradeTemplate.iconName,
              order: index,
            })),
            serviceArea: extractedData.serviceArea || "",
            serviceAreaDescription: richContent.serviceAreaDescription || "",
            ctaText: richContent.ctaPrimary || "Request a Quote",
          },
        }),
        gallery: () => ({
          slug: "gallery",
          title: "Project Gallery",
          content: {
            galleryDescription: `View our recent ${tradeTemplate.name.toLowerCase()} projects and see the quality of our work.`,
            projects: [],
            categories: mergedServices.slice(0, 5),
          },
        }),
        testimonials: () => ({
          slug: "testimonials",
          title: "Customer Reviews",
          content: {
            pageDescription: `See what our customers say about ${site.businessName}`,
            testimonials: [],
            averageRating: 5,
            totalReviews: 0,
          },
        }),
        faq: () => ({
          slug: "faq",
          title: "Frequently Asked Questions",
          content: {
            faqs: tradeTemplate.commonFaqs,
            contactPrompt: "Have a question not answered here? Contact us!",
            phone: extractedData.phone || "",
          },
        }),
        "service-area": () => ({
          slug: "service-area",
          title: "Service Area",
          content: {
            description: `${site.businessName} proudly serves ${extractedData.serviceArea || "the local area"} and surrounding communities.`,
            areas: extractedData.serviceArea?.split(",").map(a => a.trim()) || [],
            mapEnabled: true,
          },
        }),
        contact: () => ({
          slug: "contact",
          title: "Contact Us",
          content: {
            phone: extractedData.phone || "",
            email: extractedData.email || "",
            address: extractedData.address || "",
            serviceArea: extractedData.serviceArea || "",
            businessHours: "Monday - Friday: 8am - 6pm\nSaturday: 9am - 4pm\nSunday: Closed",
            emergencyService: tradeTemplate.trustBadges.some(b => b.includes("24/7") || b.includes("Emergency")),
            formEnabled: true,
            mapEnabled: true,
          },
        }),
        quote: () => ({
          slug: "quote",
          title: "Get a Quote",
          content: {
            formTitle: "Request a Free Estimate",
            formDescription: `Fill out the form below and we'll get back to you within 24 hours with a detailed quote.`,
            services: mergedServices,
            phone: extractedData.phone || "",
          },
        }),
        schedule: () => ({
          slug: "schedule",
          title: "Schedule Service",
          content: {
            title: "Book an Appointment",
            description: "Schedule a service appointment at your convenience.",
            services: mergedServices,
            phone: extractedData.phone || "",
          },
        }),
        financing: () => ({
          slug: "financing",
          title: "Financing Options",
          content: {
            title: "Flexible Payment Options",
            description: "We offer flexible financing options to make your project affordable.",
            options: [
              "0% Interest for 12 Months",
              "Low Monthly Payments",
              "Quick Approval Process"
            ],
          },
        }),
        blog: () => ({
          slug: "blog",
          title: "Blog",
          content: {
            description: `Tips, news, and insights about ${tradeTemplate.name.toLowerCase()} services.`,
            posts: [],
          },
        }),
      };

      // Create pages based on selected pages
      for (const pageId of finalPages) {
        const generator = pageGenerators[pageId];
        if (generator) {
          try {
            const pageData = generator();
            const existingPage = await storage.getPageBySiteAndSlug(site.id, pageData.slug);
            if (!existingPage) {
              await storage.createPage({
                siteId: site.id,
                slug: pageData.slug,
                title: pageData.title,
                content: pageData.content,
              });
            } else {
              // Update existing page with new content
              await storage.updatePage(existingPage.id, {
                title: pageData.title,
                content: pageData.content,
              });
            }
          } catch (pageError) {
            console.error(`Error creating/updating page ${pageId}:`, pageError);
          }
        }
      }

      // Generate redirect URL - use preview route in development
      const isDev = process.env.NODE_ENV === "development";
      const redirectUrl = isDev 
        ? `/preview/${site.subdomain}`
        : `https://${site.subdomain}.localblue.ai/`;

      res.json({
        success: true,
        site: updatedSite,
        extractedData: {
          ...extractedData,
          tradeType,
          stylePreference,
          services: mergedServices,
          certifications: mergedCertifications,
          tagline,
          selectedPages: finalPages,
        },
        tradeTemplate: {
          name: tradeTemplate.name,
          trustBadges: tradeTemplate.trustBadges,
          iconName: tradeTemplate.iconName,
        },
        styleTemplate: {
          name: styleTemplate.name,
          colors: styleTemplate.colors,
        },
        pagesCreated: finalPages,
        redirectUrl,
      });
    } catch (error) {
      console.error("Error generating site:", error);
      res.status(500).json({ error: "Failed to generate site" });
    }
  });

  // ============================================
  // Onboarding Photo and Preference Routes
  // ============================================

  // Get photos for the current onboarding session
  app.get("/api/onboarding/photos", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.siteId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const photos = await storage.getSitePhotos(req.session.siteId);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching onboarding photos:", error);
      res.status(500).json({ error: "Failed to fetch photos" });
    }
  });

  // Upload photo during onboarding
  app.post("/api/onboarding/photos", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.siteId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { url, type, caption } = req.body;

      if (!url || !type) {
        return res.status(400).json({ error: "url and type are required" });
      }

      const validTypes = ["logo", "team", "project", "before_after"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: "Invalid photo type" });
      }

      const photo = await storage.createSitePhoto({
        siteId: req.session.siteId,
        url,
        type,
        caption: caption || null,
        sortOrder: 0,
      });

      res.status(201).json(photo);
    } catch (error) {
      console.error("Error uploading onboarding photo:", error);
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  // Save style and page preferences during onboarding
  app.post("/api/onboarding/preferences", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.siteId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { stylePreference, selectedPages } = req.body;
      const updateData: Record<string, any> = {};

      if (stylePreference) {
        const validStyles = ["professional", "bold", "warm", "luxury"];
        if (validStyles.includes(stylePreference)) {
          updateData.stylePreference = stylePreference;
        }
      }

      if (selectedPages && Array.isArray(selectedPages)) {
        updateData.selectedPages = selectedPages;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid preferences provided" });
      }

      const site = await storage.updateSite(req.session.siteId, updateData);

      // Also update onboarding progress
      const progress = await storage.getOnboardingProgress(req.session.siteId);
      if (progress) {
        const existingData = (progress.collectedData as Record<string, any>) || {};
        await storage.updateOnboardingProgress(req.session.siteId, {
          collectedData: { ...existingData, ...updateData },
        });
      }

      res.json({ success: true, site });
    } catch (error) {
      console.error("Error saving onboarding preferences:", error);
      res.status(500).json({ error: "Failed to save preferences" });
    }
  });

  // ============================================
  // Appointment API Routes
  // ============================================

  // Create appointment (public route - requires tenant but not auth)
  app.post("/api/tenant/appointments", requireTenant, async (req, res) => {
    try {
      const { customerName, customerEmail, customerPhone, requestedDate, requestedTime, serviceType, notes } = req.body;

      if (!customerName || !customerEmail || !requestedDate || !requestedTime) {
        return res.status(400).json({ error: "Missing required fields: name, email, date, and time are required" });
      }

      const appointment = await storage.createAppointment({
        siteId: req.site!.id,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        requestedDate,
        requestedTime,
        serviceType: serviceType || null,
        notes: notes || null,
        status: "pending",
      });

      res.status(201).json({ success: true, id: appointment.id });
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ error: "Failed to create appointment" });
    }
  });

  // Get appointments (admin route - requires tenant auth)
  app.get("/api/tenant/appointments", requireTenantAdmin, requireTenantAuth, async (req, res) => {
    try {
      const siteAppointments = await storage.getAppointments(req.site!.id);
      res.json(siteAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  return httpServer;
}
