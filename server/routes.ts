import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tenantMiddleware, requireTenant, requireTenantAdmin, requireTenantAuth } from "./middleware/tenantMiddleware";
import { insertUserSchema, insertSiteSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";

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

  return httpServer;
}
