import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tenantMiddleware, requireTenant } from "./middleware/tenantMiddleware";
import { insertUserSchema, insertSiteSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";

const SALT_ROUNDS = 10;

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
        }
      });
    } else {
      res.json({ found: false, message: "No tenant detected for this hostname" });
    }
  });

  return httpServer;
}
