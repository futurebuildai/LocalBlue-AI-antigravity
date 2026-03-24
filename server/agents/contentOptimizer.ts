import { z } from "zod";
import type { Agent, AgentContext, AgentResult, GeneratedContentItem } from "./types";

// Zod schema for AI output validation (#7)
const contentRecommendationSchema = z.object({
  slug: z.string(),
  type: z.enum(["meta_description", "page_update"]),
  title: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  currentValue: z.string().optional().default(""),
  proposedValue: z.string(),
  reasoning: z.string(),
});
const contentRecommendationsArraySchema = z.array(contentRecommendationSchema);

export const contentOptimizer: Agent = {
  type: "content_optimizer",
  name: "Content Optimizer",
  description: "Monthly analysis of site pages with recommendations for content improvements, meta descriptions, and headlines",
  defaultSchedule: "monthly",

  async execute(ctx: AgentContext): Promise<AgentResult> {
    const { site, storage, anthropic, log } = ctx;

    // Fetch all pages for the site
    const pages = await storage.getPagesBySiteId(site.id);
    if (pages.length === 0) {
      return { success: true, output: { message: "No pages to optimize" } };
    }

    // Get analytics for past 30 days to understand page performance
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const analytics = await storage.getAnalyticsDailySummary(site.id, fmt(thirtyDaysAgo), fmt(now));

    // Aggregate page performance from analytics
    const pagePerformance = new Map<string, { views: number; days: number }>();
    for (const day of analytics) {
      for (const p of (day.topPages || [])) {
        const existing = pagePerformance.get(p.page) || { views: 0, days: 0 };
        existing.views += p.views;
        existing.days += 1;
        pagePerformance.set(p.page, existing);
      }
    }

    // Compute overall bounce rate
    const avgBounce = analytics.length > 0
      ? Math.round(analytics.reduce((s, d) => s + (d.bounceRate || 0), 0) / analytics.length)
      : 0;

    log(`Analyzing ${pages.length} pages with ${analytics.length} days of analytics data`);

    // Build page summaries for the prompt
    const pageSummaries = pages.map(page => {
      const content = page.content as Record<string, any> || {};
      const perf = pagePerformance.get(`/${page.slug}`) || pagePerformance.get(page.slug);
      const viewCount = perf?.views || 0;

      // Extract key content fields for analysis
      const contentPreview: Record<string, string> = {};
      for (const [key, value] of Object.entries(content)) {
        if (typeof value === "string" && value.length > 0) {
          contentPreview[key] = value.length > 200 ? value.slice(0, 200) + "..." : value;
        } else if (typeof value === "object" && value !== null) {
          contentPreview[key] = JSON.stringify(value).slice(0, 150) + "...";
        }
      }

      return {
        slug: page.slug,
        title: page.title,
        views30d: viewCount,
        contentKeys: Object.keys(content),
        contentPreview,
      };
    });

    // Get service pricing for context on what services to emphasize
    const servicePricing = await storage.getServicePricing(site.id);

    const prompt = `You are a content optimization advisor for a local ${site.tradeType || "contractor"} business called "${site.businessName}"${site.serviceArea ? ` serving ${site.serviceArea}` : ""}.

SITE PAGES (with 30-day performance):
${pageSummaries.map(p =>
  `- /${p.slug} (title: "${p.title}", ${p.views30d} views)\n  Content keys: ${p.contentKeys.join(", ")}\n  Preview: ${JSON.stringify(p.contentPreview).slice(0, 300)}`
).join("\n\n")}

OVERALL METRICS:
- Average bounce rate: ${avgBounce}%
- Total days of data: ${analytics.length}

SERVICES OFFERED:
${servicePricing.length > 0
  ? servicePricing.map(s => `- ${s.serviceName}: $${s.basePrice} ${s.priceUnit}`).join("\n")
  : "No service pricing configured"}

Analyze each page and identify optimization opportunities. Consider:
- Meta description quality and keyword targeting for local SEO
- Headline effectiveness for the target audience (local homeowners, builders)
- Content completeness — are key services well-represented?
- Pages that may need updating based on low traffic or high bounce rate
- Local SEO optimization (city/area mentions, service keywords)

Respond with ONLY a JSON array (no markdown). Each item represents one recommendation:
[
  {
    "slug": "<page slug>",
    "type": "meta_description" | "page_update",
    "title": "<short description of the change>",
    "priority": "high" | "medium" | "low",
    "currentValue": "<current content being changed, if applicable>",
    "proposedValue": "<proposed new content>",
    "reasoning": "<1-2 sentence explanation>"
  }
]

Provide 3-6 recommendations, prioritizing changes with the most potential impact.`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
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
      const parseResult = contentRecommendationsArraySchema.safeParse(rawJson);
      if (!parseResult.success) {
        return {
          success: false,
          output: { rawResponse: rawJson, validationErrors: parseResult.error.flatten() },
          error: "AI response failed validation",
          tokensUsed,
        };
      }
      const recommendations = parseResult.data;

      log(`Generated ${recommendations.length} content optimization recommendations`);

      // Map recommendations to generatedContent items
      const generatedContent: GeneratedContentItem[] = recommendations.map(rec => ({
        contentType: rec.type === "meta_description" ? ("meta_description" as const) : ("page_update" as const),
        targetPage: `/${rec.slug}`,
        title: rec.title,
        content: {
          slug: rec.slug,
          priority: rec.priority,
          proposedValue: rec.proposedValue,
          reasoning: rec.reasoning,
        },
        currentContent: rec.currentValue ? {
          value: rec.currentValue,
        } : undefined,
      }));

      return {
        success: true,
        output: {
          pagesAnalyzed: pages.length,
          recommendationCount: recommendations.length,
          avgBounceRate: avgBounce,
        },
        generatedContent,
        tokensUsed,
      };
    } catch (error) {
      return {
        success: false,
        output: { pagesAnalyzed: pages.length },
        error: error instanceof Error ? error.message : "AI content optimization failed",
      };
    }
  },
};
