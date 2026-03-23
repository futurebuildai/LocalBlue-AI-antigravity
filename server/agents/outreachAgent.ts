import { z } from "zod";
import type { Agent, AgentContext, AgentResult, GeneratedContentItem } from "./types";

// Zod schema for AI output validation (#7)
const outreachTemplateSchema = z.object({
  templateName: z.string(),
  targetType: z.enum(["residential_gc", "commercial_builder", "follow_up"]),
  subject: z.string(),
  body: z.string(),
  callToAction: z.string(),
  bestSentOn: z.string().default(""),
});
const outreachTemplatesArraySchema = z.array(outreachTemplateSchema);

export const outreachAgent: Agent = {
  type: "outreach_agent",
  name: "Outreach Agent",
  description: "Drafts personalized outreach emails to local builders and GCs to get on their bid lists",
  defaultSchedule: "weekly",

  async execute(ctx: AgentContext): Promise<AgentResult> {
    const { site, storage, anthropic, log } = ctx;

    // Gather context about the business — bounded date ranges (#16)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const servicePricing = await storage.getServicePricing(site.id);
    const leads = await storage.getLeadsBySiteIdInDateRange(site.id, ninetyDaysAgo, new Date());
    const rfqs = await storage.getRfqsBySite(site.id);

    // Count existing builder relationships
    const builderNames = new Set(rfqs.map(r => r.builderName));
    const wonBids = rfqs.filter(r => r.status === "accepted");

    log(`Generating outreach emails for ${site.businessName} — ${builderNames.size} existing builder relationships`);

    const prompt = `You are a business development advisor for a local ${site.tradeType || "contractor"} subcontractor. Your job is to draft compelling outreach emails to general contractors and builders to get this subcontractor on their preferred bid list.

BUSINESS PROFILE:
- Company: ${site.businessName}
- Trade: ${site.tradeType || "General Contracting"}
- Service Area: ${site.serviceArea || "Local area"}
- Services: ${(site.services || []).join(", ") || "General contracting services"}
${servicePricing.length > 0
  ? "- Pricing:\n" + servicePricing.map(s => `  - ${s.serviceName}: $${s.basePrice} ${s.priceUnit}`).join("\n")
  : ""}

TRACK RECORD:
- Total leads received: ${leads.length}
- RFQs received: ${rfqs.length}
- Bids won: ${wonBids.length}
- Existing builder relationships: ${builderNames.size} (${Array.from(builderNames).slice(0, 5).join(", ") || "none yet"})

Generate 3 different outreach email templates targeting different types of builders/GCs:
1. A cold introduction email for a general contractor who does residential construction
2. A cold introduction email for a commercial builder/developer
3. A follow-up email for a builder who previously sent an RFQ but hasn't awarded work yet

Each email should:
- Be professional but personable
- Highlight the subcontractor's specific trade and capabilities
- Mention their service area
- Include a clear call-to-action (add to bid list, schedule a meeting, etc.)
- Be concise (under 200 words per email body)
- Use {builder_name} and {builder_company} as placeholders

Respond with ONLY a JSON array (no markdown):
[
  {
    "templateName": "<descriptive name>",
    "targetType": "residential_gc" | "commercial_builder" | "follow_up",
    "subject": "<email subject line>",
    "body": "<email body text with {builder_name} and {builder_company} placeholders>",
    "callToAction": "<what you want them to do>",
    "bestSentOn": "<suggested day/time to send>"
  }
]`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      });

      const textBlock = response.content?.find(b => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        return { success: false, output: {}, error: "AI returned no text content" };
      }
      const text = textBlock.text;
      const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

      let rawJson: any;
      try {
        rawJson = JSON.parse(text.trim());
      } catch {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
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
      const parseResult = outreachTemplatesArraySchema.safeParse(rawJson);
      if (!parseResult.success) {
        return {
          success: false,
          output: { rawResponse: rawJson, validationErrors: parseResult.error.flatten() },
          error: "AI response failed validation",
          tokensUsed,
        };
      }
      const templates = parseResult.data;

      log(`Generated ${templates.length} outreach email templates`);

      const generatedContent: GeneratedContentItem[] = templates.map(template => ({
        contentType: "outreach_email" as const,
        title: `Outreach: ${template.templateName}`,
        content: {
          templateName: template.templateName,
          targetType: template.targetType,
          subject: template.subject,
          body: template.body,
          callToAction: template.callToAction,
          bestSentOn: template.bestSentOn,
          status: "draft",
        },
      }));

      return {
        success: true,
        output: {
          templatesGenerated: templates.length,
          existingBuilders: builderNames.size,
          wonBids: wonBids.length,
        },
        generatedContent,
        tokensUsed,
      };
    } catch (error) {
      return {
        success: false,
        output: {},
        error: error instanceof Error ? error.message : "Outreach email generation failed",
      };
    }
  },
};
