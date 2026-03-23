import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { z } from "zod";
import type { AgentRunner } from "../agents/runner";

const INTEGRATION_API_KEY = process.env.INTEGRATION_API_KEY || "fb-brain-demo-key-2026";

// Middleware: validate X-Integration-Key header
function requireIntegrationKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers["x-integration-key"];
  if (key !== INTEGRATION_API_KEY) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}

const pushRfqSchema = z.object({
  site_id: z.string(),
  external_rfq_id: z.string(),
  builder_name: z.string(),
  project_name: z.string(),
  project_address: z.string().optional(),
  phase_description: z.string(),
  scope_items: z.array(z.object({
    item: z.string(),
    quantity: z.number(),
    unit: z.string(),
  })).optional(),
  start_date: z.string().optional(),
  expires_at: z.string().optional(),
});

const updateBidStatusSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
});

export function registerIntegrationRoutes(app: Express & { get(key: string): any }) {
  // POST /api/integration/rfqs — FB-Brain pushes an RFQ to a tenant site
  app.post("/api/integration/rfqs", requireIntegrationKey, async (req: Request, res: Response) => {
    try {
      const result = pushRfqSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid RFQ data", details: result.error.flatten() });
      }

      const data = result.data;

      // Verify site exists
      const site = await storage.getSite(data.site_id);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }

      const rfq = await storage.createRfq({
        siteId: data.site_id,
        externalRfqId: data.external_rfq_id,
        builderName: data.builder_name,
        projectName: data.project_name,
        projectAddress: data.project_address || null,
        phaseDescription: data.phase_description,
        scopeItems: data.scope_items || [],
        startDate: data.start_date || null,
        status: "pending",
        expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      });

      // Trigger AI bid advisor (non-blocking)
      try {
        const runner = app.get("agentRunner") as AgentRunner | undefined;
        if (runner) {
          runner.triggerAgent(data.site_id, "bid_advisor", { rfqId: rfq.id })
            .catch(err => console.error("Failed to trigger bid advisor:", err));
        }
      } catch {}

      res.status(201).json({ rfq_id: rfq.id, status: "created" });
    } catch (error) {
      console.error("Integration: create RFQ failed", error);
      res.status(500).json({ error: "Failed to create RFQ" });
    }
  });

  // POST /api/integration/bids/:id/status — FB-Brain updates bid status
  app.post("/api/integration/bids/:id/status", requireIntegrationKey, async (req: Request, res: Response) => {
    try {
      const bidId = parseInt(req.params.id as string, 10);
      if (isNaN(bidId)) {
        return res.status(400).json({ error: "Invalid bid ID" });
      }

      const result = updateBidStatusSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid status data" });
      }

      const bid = await storage.updateBidStatus(bidId, result.data.status);
      if (!bid) {
        return res.status(404).json({ error: "Bid not found" });
      }

      // Also update the RFQ status based on bid outcome
      if (result.data.status === "accepted") {
        await storage.updateRfqStatus(bid.rfqId, "accepted");
      } else if (result.data.status === "rejected") {
        await storage.updateRfqStatus(bid.rfqId, "rejected");
      }

      res.json({ status: "ok" });
    } catch (error) {
      console.error("Integration: update bid status failed", error);
      res.status(500).json({ error: "Failed to update bid status" });
    }
  });
}
