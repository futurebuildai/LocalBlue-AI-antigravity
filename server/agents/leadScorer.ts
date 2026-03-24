import { z } from "zod";
import type { Agent, AgentContext, AgentResult } from "./types";

// Zod schema for AI output validation (#7)
const leadScoreResponseSchema = z.object({
  score: z.number().min(0).max(100),
  reasoning: z.string(),
  suggestedActions: z.array(z.object({
    action: z.string(),
    reason: z.string(),
    priority: z.enum(["high", "medium", "low"]),
  })).default([]),
});

export const leadScorer: Agent = {
  type: "lead_scorer",
  name: "Lead Scorer",
  description: "Scores inbound leads 0-100 based on intent signals and suggests follow-up actions",
  defaultSchedule: "on_event",

  async execute(ctx: AgentContext): Promise<AgentResult> {
    const { site, storage, anthropic, execution, log } = ctx;
    const rawLeadId = execution.input?.leadId;
    const leadId = typeof rawLeadId === "number" && Number.isFinite(rawLeadId) ? rawLeadId : undefined;

    if (!leadId) {
      return { success: false, output: {}, error: "No valid leadId provided in input" };
    }

    const lead = await storage.getLeadById(leadId);
    if (!lead) {
      return { success: false, output: {}, error: `Lead ${leadId} not found` };
    }

    log(`Scoring lead ${leadId} for site ${site.businessName}`);

    const businessContext = [
      `Business: ${site.businessName}`,
      site.tradeType ? `Trade: ${site.tradeType}` : null,
      site.services && (site.services as string[]).length > 0
        ? `Services offered: ${(site.services as string[]).join(", ")}`
        : null,
      site.serviceArea ? `Service area: ${site.serviceArea}` : null,
    ].filter(Boolean).join("\n");

    const leadContext = [
      `Name: ${lead.name}`,
      `Email: ${lead.email}`,
      lead.phone ? `Phone: ${lead.phone}` : "Phone: not provided",
      lead.message ? `Message: ${lead.message}` : "Message: none",
      `Source: ${lead.source || "contact_form"}`,
      `Submitted: ${lead.createdAt.toISOString()}`,
    ].join("\n");

    const prompt = `You are a lead scoring assistant for a local contractor business. Score this lead from 0 to 100 and suggest follow-up actions.

BUSINESS CONTEXT:
${businessContext}

LEAD DETAILS:
${leadContext}

SCORING CRITERIA:
- Phone number provided (+20 points) — shows high intent
- Message mentions specific service that matches business offerings (+15 points)
- Message describes a concrete project or timeline (+15 points)
- Message mentions urgency or emergency (+10 points)
- Email appears to be a personal/business email vs disposable (+5 points)
- Longer, detailed message vs very short/generic (+10 points)
- Base score: 25 points for any contact form submission

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "score": <number 0-100>,
  "reasoning": "<1-2 sentence explanation>",
  "suggestedActions": [
    { "action": "<specific action to take>", "reason": "<why>", "priority": "high|medium|low" }
  ]
}`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
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
          return { success: false, output: { rawResponse: text }, error: "Failed to parse AI response as JSON", tokensUsed };
        }
        try {
          rawJson = JSON.parse(jsonMatch[0]);
        } catch {
          return { success: false, output: { rawResponse: text }, error: "Extracted JSON is malformed", tokensUsed };
        }
      }

      // Validate with Zod (#7)
      const parseResult = leadScoreResponseSchema.safeParse(rawJson);
      if (!parseResult.success) {
        return {
          success: false,
          output: { rawResponse: rawJson, validationErrors: parseResult.error.flatten() },
          error: "AI response failed validation",
          tokensUsed,
        };
      }
      const parsed = parseResult.data;

      const score = Math.max(0, Math.min(100, Math.round(parsed.score)));
      const suggestedActions = parsed.suggestedActions;

      const updateData: Record<string, any> = {
        aiScore: score,
        aiSuggestedActions: suggestedActions,
        aiScoredAt: new Date(),
      };

      if (score >= 80 && lead.priority !== "high") {
        updateData.priority = "high";
      }

      await storage.updateLead(leadId, updateData);

      log(`Lead ${leadId} scored ${score}/100`);

      return {
        success: true,
        output: {
          leadId,
          score,
          reasoning: parsed.reasoning,
          suggestedActions,
          autoElevated: score >= 80 && lead.priority !== "high",
        },
        tokensUsed,
      };
    } catch (error) {
      return {
        success: false,
        output: { leadId },
        error: error instanceof Error ? error.message : "AI scoring failed",
      };
    }
  },
};
