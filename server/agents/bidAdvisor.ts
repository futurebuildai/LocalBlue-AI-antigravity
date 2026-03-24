import { z } from "zod";
import type { Agent, AgentContext, AgentResult } from "./types";
import { checkSupplierStatus, getMaterialPricing, type MaterialPricingResponse } from "../services/fbBrainClient";

// Zod schema for AI output validation (#7)
const bidRecommendationSchema = z.object({
  recommendedTotalCents: z.number().int().min(0),
  breakdown: z.object({
    materialsCents: z.number().int().min(0),
    laborCents: z.number().int().min(0),
    overheadCents: z.number().int().min(0),
    profitCents: z.number().int().min(0),
  }),
  estimatedDays: z.number().int().min(1),
  riskLevel: z.enum(["low", "medium", "high"]),
  riskFactors: z.array(z.string()).default([]),
  notes: z.string().default(""),
  reasoning: z.string(),
});

export const bidAdvisor: Agent = {
  type: "bid_advisor",
  name: "Bid Advisor",
  description: "Analyzes RFQs and recommends competitive bid amounts with cost breakdowns",
  defaultSchedule: "on_event",

  async execute(ctx: AgentContext): Promise<AgentResult> {
    const { site, storage, anthropic, execution, log } = ctx;
    const rawRfqId = execution.input?.rfqId;
    const rfqId = typeof rawRfqId === "number" && Number.isFinite(rawRfqId) ? rawRfqId : undefined;

    if (!rfqId) {
      return { success: false, output: {}, error: "No valid rfqId provided in input" };
    }

    const rfq = await storage.getRfqById(rfqId);
    if (!rfq) {
      return { success: false, output: {}, error: `RFQ ${rfqId} not found` };
    }

    log(`Generating bid recommendation for RFQ "${rfq.projectName}" from ${rfq.builderName}`);

    const servicePricing = await storage.getServicePricing(site.id);

    let materialPricing: MaterialPricingResponse | null = null;
    const scopeItems = (rfq.scopeItems as Array<{ item: string; quantity: number; unit: string }>) || [];

    if (scopeItems.length > 0) {
      try {
        const supplierStatus = await checkSupplierStatus(site.id);
        if (supplierStatus.connected) {
          materialPricing = await getMaterialPricing(site.id, scopeItems);
          log(`Got material pricing: $${(materialPricing.total_cents / 100).toFixed(2)} for ${materialPricing.items.length} items`);
        }
      } catch (err) {
        log(`Material pricing unavailable: ${err instanceof Error ? err.message : "unknown error"}`);
      }
    }

    const businessContext = [
      `Business: ${site.businessName}`,
      site.tradeType ? `Trade: ${site.tradeType}` : null,
      site.serviceArea ? `Service area: ${site.serviceArea}` : null,
    ].filter(Boolean).join("\n");

    const pricingContext = servicePricing.length > 0
      ? "SERVICE PRICING:\n" + servicePricing.map(p =>
          `- ${p.serviceName}: $${p.basePrice} ${p.priceUnit}${p.description ? ` (${p.description})` : ""}`
        ).join("\n")
      : "No service pricing configured.";

    const materialContext = materialPricing
      ? `MATERIAL COSTS (from supplier):\n` +
        materialPricing.items.map(i =>
          `- ${i.scope_item}: ${i.quantity} × $${(i.unit_price / 100).toFixed(2)} = $${(i.total_price / 100).toFixed(2)} (${i.product_name})`
        ).join("\n") +
        `\nMaterial total: $${(materialPricing.total_cents / 100).toFixed(2)}` +
        (materialPricing.unmatched_items.length > 0
          ? `\nUnmatched items (estimate needed): ${materialPricing.unmatched_items.join(", ")}`
          : "")
      : "No supplier material pricing available — estimate material costs based on scope.";

    const rfqContext = [
      `Project: ${rfq.projectName}`,
      `Builder: ${rfq.builderName}`,
      rfq.projectAddress ? `Address: ${rfq.projectAddress}` : null,
      `Phase: ${rfq.phaseDescription}`,
      rfq.startDate ? `Target start: ${rfq.startDate}` : null,
      scopeItems.length > 0
        ? `Scope of work:\n${scopeItems.map(s => `  - ${s.item}: ${s.quantity} ${s.unit}`).join("\n")}`
        : "No detailed scope items.",
    ].filter(Boolean).join("\n");

    const prompt = `You are a bid advisor for a local contractor. Analyze this RFQ and recommend a competitive bid amount.

BUSINESS CONTEXT:
${businessContext}

${pricingContext}

${materialContext}

RFQ DETAILS:
${rfqContext}

Provide a bid recommendation. Consider:
- Material costs (from supplier data if available, or estimate)
- Labor costs (based on scope complexity and estimated days)
- Overhead (typically 10-15% of direct costs)
- Profit margin (typically 15-25% for subcontractors)
- Risk factors (timeline pressure, scope complexity, unknowns)

Respond with ONLY a JSON object (no markdown):
{
  "recommendedTotalCents": <integer, total bid in cents>,
  "breakdown": {
    "materialsCents": <integer>,
    "laborCents": <integer>,
    "overheadCents": <integer>,
    "profitCents": <integer>
  },
  "estimatedDays": <integer>,
  "riskLevel": "low" | "medium" | "high",
  "riskFactors": ["<risk 1>", "<risk 2>"],
  "notes": "<1-2 sentence suggested bid notes to include>",
  "reasoning": "<2-3 sentence explanation of the recommendation>"
}`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      });

      const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
      const textBlock = response.content?.find(b => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        return { success: false, output: {}, error: "AI returned no text content", tokensUsed };
      }
      const text = textBlock.text;

      let rawJson: any;
      try {
        rawJson = JSON.parse(text.trim());
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          return { success: false, output: { rawResponse: text }, error: "Failed to parse AI response", tokensUsed };
        }
        try {
          rawJson = JSON.parse(jsonMatch[0]);
        } catch {
          return { success: false, output: { rawResponse: text }, error: "Extracted JSON is malformed", tokensUsed };
        }
      }

      // Validate with Zod (#7)
      const parseResult = bidRecommendationSchema.safeParse(rawJson);
      if (!parseResult.success) {
        return {
          success: false,
          output: { rawResponse: rawJson, validationErrors: parseResult.error.flatten() },
          error: "AI response failed validation",
          tokensUsed,
        };
      }
      const parsed = parseResult.data;

      log(`Bid recommendation: $${(parsed.recommendedTotalCents / 100).toFixed(2)} for RFQ ${rfqId}`);

      return {
        success: true,
        output: {
          rfqId,
          recommendation: parsed,
          hadMaterialPricing: !!materialPricing,
        },
        generatedContent: [{
          contentType: "bid_proposal",
          title: `Bid recommendation for "${rfq.projectName}"`,
          content: {
            rfqId,
            builderName: rfq.builderName,
            projectName: rfq.projectName,
            ...parsed,
          },
        }],
        tokensUsed,
      };
    } catch (error) {
      return {
        success: false,
        output: { rfqId },
        error: error instanceof Error ? error.message : "AI bid analysis failed",
      };
    }
  },
};
