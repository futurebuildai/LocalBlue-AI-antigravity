import type { Express } from "express";
import { storage } from "../storage";
import { requireTenantAdmin, requireTenantAuth, requireTenantRole } from "../middleware/tenantMiddleware";
import { AGENT_TYPES, CONTENT_REVIEW_STATUSES, type AgentType, type ContentReviewStatus } from "@shared/schema";
import type { AgentRunner } from "../agents/runner";
import { logger } from "../index";
import { sendOutreachEmail } from "../services/email";

const MAX_QUERY_LIMIT = 200;
const DEFAULT_PAGE_SIZE = 50;

function clampLimit(raw: string | undefined, defaultVal: number): number {
  const parsed = parseInt(raw as string);
  if (isNaN(parsed) || parsed < 1) return defaultVal;
  return Math.min(parsed, MAX_QUERY_LIMIT);
}

function parseCursor(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const parsed = parseInt(raw);
  return isNaN(parsed) || parsed < 1 ? undefined : parsed;
}

export function registerAgentRoutes(app: Express, agentRunner: AgentRunner) {
  // Get all agent configs for the current site
  app.get("/api/tenant/agents/configs", requireTenantAdmin, requireTenantAuth, async (req, res) => {
    try {
      const configs = await storage.getAgentConfigs(req.site!.id);
      res.json(configs);
    } catch (error) {
      logger.error({ err: error, path: req.path }, "Error fetching agent configs");
      res.status(500).json({ error: "Failed to fetch agent configs" });
    }
  });

  // Update agent config (enable/disable, schedule, preferences)
  app.patch("/api/tenant/agents/:type/config", requireTenantAdmin, requireTenantAuth, requireTenantRole(["owner", "admin"]), async (req, res) => {
    try {
      const agentType = req.params.type as AgentType;
      if (!AGENT_TYPES.includes(agentType)) {
        return res.status(400).json({ error: "Invalid agent type" });
      }

      const { enabled, schedule, preferences } = req.body;

      // Validate types
      if (enabled !== undefined && typeof enabled !== "boolean") {
        return res.status(400).json({ error: "enabled must be a boolean" });
      }
      const validSchedules = ["on_event", "daily", "weekly", "monthly"];
      if (schedule !== undefined && (typeof schedule !== "string" || !validSchedules.includes(schedule))) {
        return res.status(400).json({ error: `Invalid schedule. Must be one of: ${validSchedules.join(", ")}` });
      }
      if (preferences !== undefined && (typeof preferences !== "object" || preferences === null || Array.isArray(preferences))) {
        return res.status(400).json({ error: "preferences must be a JSON object" });
      }

      const config = await storage.upsertAgentConfig({
        siteId: req.site!.id,
        agentType,
        ...(enabled !== undefined ? { enabled } : {}),
        ...(schedule ? { schedule } : {}),
        ...(preferences ? { preferences } : {}),
      });

      res.json(config);
    } catch (error) {
      logger.error({ err: error, path: req.path }, "Error updating agent config");
      res.status(500).json({ error: "Failed to update agent config" });
    }
  });

  // Manually trigger an agent
  app.post("/api/tenant/agents/:type/trigger", requireTenantAdmin, requireTenantAuth, requireTenantRole(["owner", "admin"]), async (req, res) => {
    try {
      const agentType = req.params.type as AgentType;
      if (!AGENT_TYPES.includes(agentType)) {
        return res.status(400).json({ error: "Invalid agent type" });
      }

      const execution = await agentRunner.triggerManual(req.site!.id, agentType);
      res.status(201).json(execution);
    } catch (error) {
      logger.error({ err: error, path: req.path }, "Error triggering agent");
      res.status(500).json({ error: "Failed to trigger agent" });
    }
  });

  // Get recent agent executions (cursor-based pagination)
  app.get("/api/tenant/agents/executions", requireTenantAdmin, requireTenantAuth, async (req, res) => {
    try {
      const limit = clampLimit(req.query.limit as string, DEFAULT_PAGE_SIZE);
      const cursor = parseCursor(req.query.cursor as string);
      const executions = await storage.getAgentExecutionsBySitePaginated(req.site!.id, limit, cursor);

      const nextCursor = executions.length === limit ? executions[executions.length - 1].id : undefined;
      res.json({ data: executions, nextCursor });
    } catch (error) {
      logger.error({ err: error, path: req.path }, "Error fetching agent executions");
      res.status(500).json({ error: "Failed to fetch executions" });
    }
  });

  // Get a single execution detail
  app.get("/api/tenant/agents/executions/:id", requireTenantAdmin, requireTenantAuth, async (req, res) => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const id = parseInt(idParam);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid execution ID" });

      const execution = await storage.getAgentExecution(id);
      if (!execution || execution.siteId !== req.site!.id) {
        return res.status(404).json({ error: "Execution not found" });
      }

      res.json(execution);
    } catch (error) {
      logger.error({ err: error, path: req.path }, "Error fetching execution");
      res.status(500).json({ error: "Failed to fetch execution" });
    }
  });

  // Get generated content (cursor-based pagination)
  app.get("/api/tenant/agents/content", requireTenantAdmin, requireTenantAuth, async (req, res) => {
    try {
      const statusParam = req.query.status as string | undefined;
      let status: ContentReviewStatus | undefined;
      if (statusParam) {
        if (!(CONTENT_REVIEW_STATUSES as readonly string[]).includes(statusParam)) {
          return res.status(400).json({ error: `Invalid status. Must be one of: ${CONTENT_REVIEW_STATUSES.join(", ")}` });
        }
        status = statusParam as ContentReviewStatus;
      }
      const limit = clampLimit(req.query.limit as string, DEFAULT_PAGE_SIZE);
      const cursor = parseCursor(req.query.cursor as string);
      const content = await storage.getGeneratedContentBySite(req.site!.id, status, limit, cursor);

      const nextCursor = content.length === limit ? content[content.length - 1].id : undefined;
      res.json({ data: content, nextCursor });
    } catch (error) {
      logger.error({ err: error, path: req.path }, "Error fetching generated content");
      res.status(500).json({ error: "Failed to fetch generated content" });
    }
  });

  // Approve generated content (transactional — atomic lock + approve + apply)
  app.post("/api/tenant/agents/content/:id/approve", requireTenantAdmin, requireTenantAuth, requireTenantRole(["owner", "admin"]), async (req, res) => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const id = parseInt(idParam);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid content ID" });

      const result = await storage.approveAndApplyContent(id, req.site!.id, req.session.userId);
      res.json({ ...result.content, applied: result.applied });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to approve content";
      if (message.includes("not found") || message.includes("already reviewed")) {
        return res.status(409).json({ error: message });
      }
      logger.error({ err: error, path: req.path }, "Error approving content");
      res.status(500).json({ error: "Failed to approve content" });
    }
  });

  // Reject generated content
  app.post("/api/tenant/agents/content/:id/reject", requireTenantAdmin, requireTenantAuth, requireTenantRole(["owner", "admin"]), async (req, res) => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const id = parseInt(idParam);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid content ID" });

      const content = await storage.getGeneratedContentById(id);
      if (!content || content.siteId !== req.site!.id) {
        return res.status(404).json({ error: "Content not found" });
      }
      if (content.status !== "pending_review") {
        return res.status(409).json({ error: "Content already reviewed" });
      }

      const updated = await storage.updateGeneratedContentStatus(id, "rejected", req.session.userId);
      res.json(updated);
    } catch (error) {
      logger.error({ err: error, path: req.path }, "Error rejecting content");
      res.status(500).json({ error: "Failed to reject content" });
    }
  });

  // Send an approved outreach email
  app.post("/api/tenant/agents/content/:id/send", requireTenantAdmin, requireTenantAuth, requireTenantRole(["owner", "admin"]), async (req, res) => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const id = parseInt(idParam);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid content ID" });

      const content = await storage.getGeneratedContentById(id);
      if (!content || content.siteId !== req.site!.id) {
        return res.status(404).json({ error: "Content not found" });
      }
      if (content.contentType !== "outreach_email") {
        return res.status(400).json({ error: "Only outreach emails can be sent" });
      }
      if (content.status !== "approved" && content.status !== "applied") {
        return res.status(409).json({ error: "Content must be approved before sending" });
      }

      const { recipientEmail, recipientName, recipientCompany } = req.body;
      if (!recipientEmail || !recipientName) {
        return res.status(400).json({ error: "recipientEmail and recipientName are required" });
      }
      if (typeof recipientEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      if (typeof recipientName !== "string" || recipientName.length > 200) {
        return res.status(400).json({ error: "recipientName must be a string under 200 characters" });
      }

      const site = req.site!;
      const emailContent = content.content as Record<string, any>;
      if (!emailContent || typeof emailContent !== "object" || !emailContent.subject || !emailContent.body) {
        return res.status(400).json({ error: "Email content is malformed — missing subject or body" });
      }

      // Replace placeholders in subject and body
      const fillPlaceholders = (text: string) =>
        text
          .replace(/\{builder_name\}/gi, recipientName)
          .replace(/\{builder_company\}/gi, recipientCompany || recipientName);

      const sent = await sendOutreachEmail({
        fromBusinessName: site.businessName,
        fromEmail: site.email || `noreply@localblue.co`,
        recipientEmail,
        recipientName,
        recipientCompany,
        subject: fillPlaceholders(emailContent.subject || content.title),
        body: fillPlaceholders(emailContent.body || ""),
      });

      if (!sent) {
        return res.status(502).json({ error: "Failed to send email" });
      }

      // Mark as applied if it was only approved
      if (content.status === "approved") {
        await storage.updateGeneratedContentStatus(id, "applied", req.session.userId);
      }

      res.json({ success: true, sentTo: recipientEmail });
    } catch (error) {
      logger.error({ err: error, path: req.path }, "Error sending outreach email");
      res.status(500).json({ error: "Failed to send outreach email" });
    }
  });

  // Activity feed — combines recent executions + generated content (cursor-based)
  app.get("/api/tenant/agents/activity", requireTenantAdmin, requireTenantAuth, async (req, res) => {
    try {
      const limit = clampLimit(req.query.limit as string, 20);
      const execCursor = parseCursor(req.query.execCursor as string);
      const contentCursor = parseCursor(req.query.contentCursor as string);

      const [executions, content] = await Promise.all([
        storage.getAgentExecutionsBySitePaginated(req.site!.id, limit, execCursor),
        storage.getGeneratedContentBySite(req.site!.id, undefined, limit, contentCursor),
      ]);

      res.json({
        executions: {
          data: executions,
          nextCursor: executions.length === limit ? executions[executions.length - 1].id : undefined,
        },
        content: {
          data: content,
          nextCursor: content.length === limit ? content[content.length - 1].id : undefined,
        },
      });
    } catch (error) {
      logger.error({ err: error, path: req.path }, "Error fetching activity");
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });
}
