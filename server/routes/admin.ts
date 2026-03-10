import type { Express } from "express";
import { storage } from "../storage";
import { requirePlatformAdmin } from "../middleware/tenantMiddleware";
import { insertSiteSchema, insertTenantUserSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

const SALT_ROUNDS = 10;

export function registerAdminRoutes(app: Express) {
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

      let tenantUsers = await storage.getTenantUsersBySiteId(siteId);
      let targetUser = tenantUsers[0];

      if (!targetUser) {
        // Create a default admin user if none exists
        const hashedPassword = await bcrypt.hash('impersonate-only', 10);
        targetUser = await storage.createTenantUser({
          siteId,
          email: `admin@${site.subdomain}.local`,
          password: hashedPassword,
          name: 'Site Admin'
        } as any);
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

  // Preview routes require platform admin authentication
  app.use("/api/preview", requirePlatformAdmin);

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

  // List all pages for a preview site
  app.get("/api/preview/:subdomain/pages", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) return res.status(404).json({ error: "Site not found" });
      const pages = await storage.getPagesBySiteId(site.id);
      res.json(pages);
    } catch (error) {
      console.error("Error fetching pages for preview:", error);
      res.status(500).json({ error: "Failed to fetch pages" });
    }
  });

  // Get single page for preview site
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

  // Get photos for preview site
  app.get("/api/preview/:subdomain/photos", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) return res.status(404).json({ error: "Site not found" });
      const photos = await storage.getSitePhotos(site.id);
      res.json(photos.filter(p => p.type !== 'logo'));
    } catch (error) {
      console.error("Error fetching photos for preview:", error);
      res.status(500).json({ error: "Failed to fetch photos" });
    }
  });

  // Get testimonials for preview site
  app.get("/api/preview/:subdomain/testimonials", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) return res.status(404).json({ error: "Site not found" });
      const testimonials = await storage.getTestimonials(site.id);
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching testimonials for preview:", error);
      res.status(500).json({ error: "Failed to fetch testimonials" });
    }
  });

  // Get lead metrics for preview
  app.get("/api/preview/:subdomain/leads/metrics", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) return res.status(404).json({ error: "Site not found" });
      const leads = await storage.getLeadsBySiteId(site.id);
      const now = new Date();
      const thisMonth = leads.filter(l => { const d = new Date(l.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
      const won = leads.filter(l => l.stage === 'won');
      const totalValue = won.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
      res.json({
        total: leads.length,
        thisMonth: thisMonth.length,
        conversionRate: leads.length > 0 ? Math.round((won.length / leads.length) * 100) : 0,
        totalValue,
        byStage: { new: leads.filter(l => l.stage === 'new').length, contacted: leads.filter(l => l.stage === 'contacted').length, quoted: leads.filter(l => l.stage === 'quoted').length, won: won.length, lost: leads.filter(l => l.stage === 'lost').length }
      });
    } catch (error) {
      console.error("Error fetching lead metrics for preview:", error);
      res.status(500).json({ error: "Failed to fetch lead metrics" });
    }
  });

  // Get leads for preview site
  app.get("/api/preview/:subdomain/leads", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) return res.status(404).json({ error: "Site not found" });
      const leads = await storage.getLeadsBySiteId(site.id);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads for preview:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Get users for preview site
  app.get("/api/preview/:subdomain/users", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) return res.status(404).json({ error: "Site not found" });
      const users = await storage.getTenantUsersBySiteId(site.id);
      const sanitized = users.map(({ password, ...u }) => u);
      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching users for preview:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get settings for preview site
  app.get("/api/preview/:subdomain/settings", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) return res.status(404).json({ error: "Site not found" });
      res.json(site);
    } catch (error) {
      console.error("Error fetching settings for preview:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Analytics summary for preview
  app.get("/api/preview/:subdomain/analytics/summary", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) return res.status(404).json({ error: "Site not found" });
      res.json({ dailyData: [], totals: { pageViews: 0, uniqueVisitors: 0, avgDuration: 0, bounceRate: 0 } });
    } catch (error) {
      console.error("Error fetching analytics for preview:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Get lead notes for preview
  app.get("/api/preview/:subdomain/leads/:id/notes", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) return res.status(404).json({ error: "Site not found" });
      const notes = await storage.getLeadNotes(parseInt(req.params.id));
      res.json(notes);
    } catch (error) {
      console.error("Error fetching lead notes for preview:", error);
      res.status(500).json({ error: "Failed to fetch lead notes" });
    }
  });

  // Toggle publish for preview site
  app.post("/api/preview/:subdomain/publish", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) return res.status(404).json({ error: "Site not found" });
      const updatedSite = await storage.updateSite(site.id, { isPublished: !site.isPublished });
      res.json(updatedSite);
    } catch (error) {
      console.error("Error toggling publish for preview:", error);
      res.status(500).json({ error: "Failed to toggle publish" });
    }
  });

  // Submit lead from preview site
  app.post("/api/preview/:subdomain/leads", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) return res.status(404).json({ error: "Site not found" });
      const lead = await storage.createLead({ ...req.body, siteId: site.id });
      res.json(lead);
    } catch (error) {
      console.error("Error creating lead for preview:", error);
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  // Create lead note for preview
  app.post("/api/preview/:subdomain/leads/:id/notes", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) return res.status(404).json({ error: "Site not found" });
      const note = await storage.createLeadNote({ leadId: parseInt(req.params.id), siteId: site.id, content: req.body.content });
      res.json(note);
    } catch (error) {
      console.error("Error creating lead note for preview:", error);
      res.status(500).json({ error: "Failed to create lead note" });
    }
  });

  // Update settings for preview
  app.patch("/api/preview/:subdomain/settings", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) return res.status(404).json({ error: "Site not found" });
      const { businessName, brandColor, phone, email, address, enableChatbot, enableQuoteCalculator } = req.body;
      const updatedSite = await storage.updateSite(site.id, { businessName, brandColor, phone, email, address, enableChatbot, enableQuoteCalculator });
      res.json(updatedSite);
    } catch (error) {
      console.error("Error updating settings for preview:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Update page content for preview
  app.patch("/api/preview/:subdomain/pages/:slug", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) return res.status(404).json({ error: "Site not found" });
      const page = await storage.getPageBySiteAndSlug(site.id, req.params.slug);
      if (!page) return res.status(404).json({ error: "Page not found" });
      const updated = await storage.updatePage(page.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating page for preview:", error);
      res.status(500).json({ error: "Failed to update page" });
    }
  });

  // Update lead stage for preview
  app.patch("/api/preview/:subdomain/leads/:id/stage", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) return res.status(404).json({ error: "Site not found" });
      const lead = await storage.updateLead(parseInt(req.params.id), { stage: req.body.stage });
      res.json(lead);
    } catch (error) {
      console.error("Error updating lead stage for preview:", error);
      res.status(500).json({ error: "Failed to update lead stage" });
    }
  });

  // Update lead priority for preview
  app.patch("/api/preview/:subdomain/leads/:id/priority", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) return res.status(404).json({ error: "Site not found" });
      const lead = await storage.updateLead(parseInt(req.params.id), { priority: req.body.priority });
      res.json(lead);
    } catch (error) {
      console.error("Error updating lead priority for preview:", error);
      res.status(500).json({ error: "Failed to update lead priority" });
    }
  });

  // Update lead for preview
  app.patch("/api/preview/:subdomain/leads/:id", async (req, res) => {
    try {
      const site = await storage.getSiteBySubdomain(req.params.subdomain);
      if (!site) return res.status(404).json({ error: "Site not found" });
      const lead = await storage.updateLead(parseInt(req.params.id), req.body);
      res.json(lead);
    } catch (error) {
      console.error("Error updating lead for preview:", error);
      res.status(500).json({ error: "Failed to update lead" });
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
}
