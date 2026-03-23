import { z } from "zod";
import type { Agent, AgentContext, AgentResult, GeneratedContentItem } from "./types";

// Zod schema for AI output validation (#7)
const seoAnalysisSchema = z.object({
  keywords: z.array(z.object({
    keyword: z.string(),
    searchIntent: z.enum(["informational", "transactional", "navigational"]),
    priority: z.enum(["high", "medium", "low"]),
    monthlyEstimate: z.string(),
  })).default([]),
  pageOptimizations: z.array(z.object({
    slug: z.string(),
    currentTitle: z.string(),
    proposedTitle: z.string(),
    currentMeta: z.string().default(""),
    proposedMeta: z.string(),
    additionalNotes: z.string().default(""),
  })).default([]),
  contentGaps: z.array(z.object({
    suggestedSlug: z.string(),
    title: z.string(),
    description: z.string(),
    priority: z.enum(["high", "medium", "low"]),
  })).default([]),
  localSeoTips: z.array(z.string()).default([]),
});

export const seoAgent: Agent = {
  type: "seo_agent",
  name: "SEO Agent",
  description: "Monthly SEO analysis with keyword research, meta optimization, and content recommendations for local search visibility",
  defaultSchedule: "monthly",

  async execute(ctx: AgentContext): Promise<AgentResult> {
    const { site, storage, anthropic, log } = ctx;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Gather performance data — bounded date range for leads (#16)
    const thirtyDaysAgoDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [dailyData, leads, pages, servicePricing] = await Promise.all([
      storage.getAnalyticsDailySummary(site.id, thirtyDaysAgo, today),
      storage.getLeadsBySiteIdInDateRange(site.id, thirtyDaysAgoDate, new Date()),
      storage.getPagesBySiteId(site.id),
      storage.getServicePricing(site.id),
    ]);

    const sitePageViews = dailyData.reduce((sum, d) => sum + (d.pageViews || 0), 0);
    const avgBounce = dailyData.length > 0
      ? Math.round(dailyData.reduce((s, d) => s + (d.bounceRate || 0), 0) / dailyData.length)
      : 0;

    // Merge top pages and referrers across the period
    const pageMap = new Map<string, number>();
    const refMap = new Map<string, number>();
    for (const day of dailyData) {
      for (const p of (day.topPages || [])) {
        pageMap.set(p.page, (pageMap.get(p.page) || 0) + p.views);
      }
      for (const r of (day.topReferrers || [])) {
        refMap.set(r.referrer, (refMap.get(r.referrer) || 0) + r.count);
      }
    }
    const topPages = Array.from(pageMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const topReferrers = Array.from(refMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

    log(`SEO analysis for ${site.businessName}: ${pages.length} pages, ${sitePageViews} views last 30d`);

    const prompt = `You are a local SEO expert for contractor and home service businesses. Analyze this site and provide comprehensive SEO recommendations.

SITE INFORMATION:
- Business Name: ${site.businessName}
- Trade Type: ${site.tradeType || "general_contractor"}
- Service Area: ${site.serviceArea || "Local area"}
- Services: ${(site.services || []).join(", ") || "Not specified"}

SERVICE PRICING:
${servicePricing.length > 0
  ? servicePricing.map(s => `- ${s.serviceName}: $${s.basePrice} ${s.priceUnit}`).join("\n")
  : "No service pricing configured"}

PERFORMANCE DATA (Last 30 days):
- Total Page Views: ${sitePageViews}
- Average Bounce Rate: ${avgBounce}%
- Total Leads: ${leads.length}
- Top Pages: ${topPages.map(([page, views]) => `${page} (${views} views)`).join(", ") || "none"}
- Top Referrers: ${topReferrers.map(([ref, count]) => `${ref} (${count})`).join(", ") || "none"}

EXISTING PAGES:
${pages.map(p => {
  const content = p.content as Record<string, any> || {};
  const metaDesc = content.metaDescription || content.meta_description || "";
  return `- /${p.slug}: "${p.title}"${metaDesc ? ` [meta: "${metaDesc.slice(0, 100)}"]` : " [no meta description]"}`;
}).join("\n")}

Provide a comprehensive SEO analysis. Include:

1. **Keyword Research**: Identify 8-10 target keywords for this business considering their trade, services, and location. Mix of short-tail and long-tail.
2. **Page Optimizations**: For each page, recommend meta title/description improvements optimized for local search.
3. **Content Gaps**: Identify missing pages or content that should exist (e.g., service-specific pages, area pages, FAQ).
4. **Local SEO**: Specific recommendations for improving local search visibility.

Respond with ONLY a JSON object (no markdown):
{
  "keywords": [
    { "keyword": "<keyword>", "searchIntent": "informational|transactional|navigational", "priority": "high|medium|low", "monthlyEstimate": "<rough monthly search volume estimate>" }
  ],
  "pageOptimizations": [
    {
      "slug": "<page slug>",
      "currentTitle": "<current title>",
      "proposedTitle": "<optimized title>",
      "currentMeta": "<current meta or empty>",
      "proposedMeta": "<optimized meta description, 150-160 chars>",
      "additionalNotes": "<any other page-specific recommendations>"
    }
  ],
  "contentGaps": [
    { "suggestedSlug": "<url slug>", "title": "<page title>", "description": "<what this page should cover>", "priority": "high|medium|low" }
  ],
  "localSeoTips": ["<tip 1>", "<tip 2>", "<tip 3>"]
}`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
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
      const parseResult = seoAnalysisSchema.safeParse(rawJson);
      if (!parseResult.success) {
        return {
          success: false,
          output: { rawResponse: rawJson, validationErrors: parseResult.error.flatten() },
          error: "AI response failed validation",
          tokensUsed,
        };
      }
      const parsed = parseResult.data;

      // Populate seoMetrics table as single source of truth (#19 — removed dual writes to seoOptimizations)
      const keywordData = parsed.keywords.map(k => ({
        keyword: k.keyword,
        position: null,
        impressions: 0,
        clicks: 0,
      }));

      await storage.createSeoMetric({
        siteId: site.id,
        month: currentMonth,
        keywords: keywordData,
        organicTraffic: sitePageViews,
        totalLeads: leads.length,
        conversionRate: sitePageViews > 0 ? Math.round((leads.length / sitePageViews) * 10000) : 0,
      });

      log(`SEO analysis complete: ${parsed.keywords.length} keywords, ${parsed.pageOptimizations.length} page optimizations`);

      // Generate content items for review
      const generatedContent: GeneratedContentItem[] = [];

      // Meta description updates as reviewable content
      for (const opt of parsed.pageOptimizations) {
        if (opt.proposedMeta && opt.proposedMeta !== opt.currentMeta) {
          generatedContent.push({
            contentType: "meta_description",
            targetPage: `/${opt.slug}`,
            title: `SEO: Update meta for /${opt.slug}`,
            content: {
              slug: opt.slug,
              proposedTitle: opt.proposedTitle,
              proposedValue: opt.proposedMeta,
              additionalNotes: opt.additionalNotes,
              reasoning: `Optimized for local SEO targeting "${site.serviceArea || "local"}" ${site.tradeType || "contractor"} searches`,
            },
            currentContent: {
              value: opt.currentMeta || "(no meta description)",
              title: opt.currentTitle,
            },
          });
        }
      }

      // Overall SEO insight
      generatedContent.push({
        contentType: "insight",
        title: `SEO Analysis — ${currentMonth}`,
        content: {
          period: { month: currentMonth },
          keywords: parsed.keywords as unknown[],
          contentGaps: parsed.contentGaps as unknown[],
          localSeoTips: parsed.localSeoTips as string[],
          stats: {
            pageViews: sitePageViews,
            leads: leads.length,
            bounceRate: avgBounce,
            pagesAnalyzed: pages.length,
            keywordsIdentified: parsed.keywords.length,
            optimizationsProposed: parsed.pageOptimizations.length,
          },
        },
      });

      return {
        success: true,
        output: {
          month: currentMonth,
          keywordsFound: parsed.keywords.length,
          optimizationsProposed: parsed.pageOptimizations.length,
          contentGaps: parsed.contentGaps.length,
        },
        generatedContent,
        tokensUsed,
      };
    } catch (error) {
      return {
        success: false,
        output: { month: currentMonth },
        error: error instanceof Error ? error.message : "SEO analysis failed",
      };
    }
  },
};
