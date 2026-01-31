import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tenantMiddleware, requireTenant, requireTenantAdmin, requireTenantAuth } from "./middleware/tenantMiddleware";
import { insertUserSchema, insertSiteSchema, insertLeadSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";
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
  // Apply tenant middleware globally
  app.use(tenantMiddleware);

  // ============================================
  // Admin API Routes (no tenant context required)
  // ============================================

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

  // --- Users CRUD ---

  // Get all users (optionally filtered by site)
  app.get("/api/admin/users", async (req, res) => {
    try {
      const siteId = req.query.siteId as string | undefined;
      let users;
      
      if (siteId) {
        users = await storage.getUsersBySiteId(siteId);
      } else {
        users = await storage.getAllUsers();
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
      const user = await storage.getUser(req.params.id);
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
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid user data", details: result.error.flatten() });
      }

      // Check if email is already taken
      const existingUser = await storage.getUserByEmail(result.data.email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(result.data.password, SALT_ROUNDS);

      const user = await storage.createUser({
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
      const partialSchema = insertUserSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid user data", details: result.error.flatten() });
      }

      // If email is being changed, check if it's already taken
      if (result.data.email) {
        const existingUser = await storage.getUserByEmail(result.data.email);
        if (existingUser && existingUser.id !== req.params.id) {
          return res.status(409).json({ error: "Email already registered" });
        }
      }

      // If password is being updated, hash it
      let updateData = { ...result.data };
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
      }

      const user = await storage.updateUser(req.params.id, updateData);
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
      const deleted = await storage.deleteUser(req.params.id);
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
      const existingUser = await storage.getUserByEmail(email);
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
      const user = await storage.createUser({
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

  // Submit lead/contact form (public route - requires tenant but not auth)
  app.post("/api/site/leads", requireTenant, async (req, res) => {
    try {
      const leadData = {
        ...req.body,
        siteId: req.site!.id,
      };

      const result = insertLeadSchema.safeParse(leadData);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid lead data", details: result.error.flatten() });
      }

      const lead = await storage.createLead(result.data);
      res.status(201).json({ success: true, id: lead.id });
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(500).json({ error: "Failed to submit contact form" });
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
  // Tenant Admin API Routes
  // ============================================

  // Tenant Auth: Login
  app.post("/api/tenant/auth/login", requireTenantAdmin, async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid credentials format", details: result.error.flatten() });
      }

      const { email, password } = result.data;

      // Find user by email
      const user = await storage.getUserByEmail(email);
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
      const user = await storage.getUser(req.session.userId!);
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
      const users = await storage.getUsersBySiteId(req.site!.id);
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
      const result = insertUserSchema.safeParse({
        ...req.body,
        siteId: req.site!.id, // Force the user to belong to this tenant
      });
      
      if (!result.success) {
        return res.status(400).json({ error: "Invalid user data", details: result.error.flatten() });
      }

      // Check if email is already taken
      const existingUser = await storage.getUserByEmail(result.data.email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(result.data.password, SALT_ROUNDS);

      const user = await storage.createUser({
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

  const ONBOARDING_SYSTEM_PROMPT = `You are a friendly AI assistant helping a contractor set up their professional website for LocalBlue.ai. Your goal is to gather the information needed to create their website in a conversational way.

You need to gather:
1. What services they offer (e.g., plumbing, electrical, HVAC, roofing, etc.)
2. Their service area (cities, regions, or radius)
3. A brief description of their business and what makes them unique
4. Their brand color preference (ask what color represents their brand best)

Guidelines:
- Be friendly, concise, and professional
- Ask one or two questions at a time, not all at once
- Show enthusiasm about their business
- After gathering enough information (typically 3-5 exchanges), let them know you have everything needed
- When you have enough info, include the phrase "READY_TO_GENERATE" somewhere in your response (this will trigger the generate button)
- Keep responses short - 2-3 sentences max

Start by greeting them and asking about their services.`;

  // Onboarding: Get current session info
  app.get("/api/onboarding/session", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.siteId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
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

      const { password: _, ...sanitizedUser } = user;
      res.json({ user: sanitizedUser, site, messages });
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

      // Stream response from Anthropic
      const stream = anthropic.messages.stream({
        model: "claude-opus-4-5",
        max_tokens: 1024,
        system: ONBOARDING_SYSTEM_PROMPT,
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

      // Check if ready to generate
      const readyToGenerate = fullResponse.includes("READY_TO_GENERATE");

      res.write(`data: ${JSON.stringify({ done: true, readyToGenerate })}\n\n`);
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

      // Use AI to extract site information
      const extractionResponse = await anthropic.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 1024,
        system: `You are a data extraction assistant. Extract the following information from the conversation and return it as JSON:
{
  "services": ["list", "of", "services"],
  "serviceArea": "the service area mentioned",
  "businessDescription": "a brief description of the business",
  "brandColor": "a hex color code that best matches what they mentioned (default to #2563EB if not specified)"
}

Only return valid JSON, nothing else.`,
        messages: [
          {
            role: "user",
            content: `Extract the business information from this onboarding conversation:\n\n${conversationText}`,
          },
        ],
      });

      // Parse the extracted data
      let extractedData;
      try {
        const responseText = extractionResponse.content[0].type === "text" 
          ? extractionResponse.content[0].text 
          : "";
        extractedData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse extraction response:", parseError);
        extractedData = {
          services: [],
          serviceArea: "",
          businessDescription: "",
          brandColor: "#2563EB",
        };
      }

      // Update site with extracted information
      const updatedSite = await storage.updateSite(site.id, {
        services: extractedData.services || [],
        brandColor: extractedData.brandColor || "#2563EB",
        isPublished: true,
      });

      // Create default pages with the extracted content
      const defaultPages = [
        {
          siteId: site.id,
          slug: "home",
          title: "Home",
          content: {
            heroTagline: `Professional ${(extractedData.services || []).slice(0, 2).join(" & ")} Services`,
            heroDescription: extractedData.businessDescription || `Quality services for your home and business in ${extractedData.serviceArea || "your area"}.`,
          },
        },
        {
          siteId: site.id,
          slug: "about",
          title: "About Us",
          content: {
            description: extractedData.businessDescription || "",
            serviceArea: extractedData.serviceArea || "",
          },
        },
        {
          siteId: site.id,
          slug: "services",
          title: "Our Services",
          content: {
            servicesList: extractedData.services || [],
          },
        },
        {
          siteId: site.id,
          slug: "contact",
          title: "Contact Us",
          content: {
            serviceArea: extractedData.serviceArea || "",
          },
        },
      ];

      // Create pages (ignore errors if they already exist)
      for (const pageData of defaultPages) {
        try {
          const existingPage = await storage.getPageBySiteAndSlug(site.id, pageData.slug);
          if (!existingPage) {
            await storage.createPage(pageData);
          }
        } catch (pageError) {
          console.error(`Error creating page ${pageData.slug}:`, pageError);
        }
      }

      // Generate redirect URL for tenant admin
      const redirectUrl = `https://${site.subdomain}.localblue.ai/`;

      res.json({
        success: true,
        site: updatedSite,
        extractedData,
        redirectUrl,
      });
    } catch (error) {
      console.error("Error generating site:", error);
      res.status(500).json({ error: "Failed to generate site" });
    }
  });

  return httpServer;
}
