import { z } from "zod";
import type { Agent, AgentContext, AgentResult } from "./types";

// Zod schema for AI output validation (#7)
const insightResponseSchema = z.object({
  headline: z.string(),
  highlights: z.array(z.string()).default([]),
  trends: z.string(),
  leadInsight: z.string(),
  recommendations: z.array(z.object({
    action: z.string(),
    reason: z.string(),
  })).default([]),
});

export const analyticsInsights: Agent = {
  type: "analytics_insights",
  name: "Analytics Insights",
  description: "Generates weekly plain-language analytics insights with traffic trends, top pages, and recommendations",
  defaultSchedule: "weekly",

  async execute(ctx: AgentContext): Promise<AgentResult> {
    const { site, storage, anthropic, log } = ctx;

    // Get current 7-day window and previous 7-day window
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - 1); // yesterday
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6); // 7 days ending yesterday

    const prevWeekEnd = new Date(weekStart);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
    const prevWeekStart = new Date(prevWeekEnd);
    prevWeekStart.setDate(prevWeekStart.getDate() - 6);

    const fmt = (d: Date) => d.toISOString().split("T")[0];

    log(`Fetching analytics: ${fmt(weekStart)} to ${fmt(weekEnd)} vs ${fmt(prevWeekStart)} to ${fmt(prevWeekEnd)}`);

    const [currentWeek, previousWeek] = await Promise.all([
      storage.getAnalyticsDailySummary(site.id, fmt(weekStart), fmt(weekEnd)),
      storage.getAnalyticsDailySummary(site.id, fmt(prevWeekStart), fmt(prevWeekEnd)),
    ]);

    if (currentWeek.length === 0) {
      return {
        success: true,
        output: { message: "No analytics data available for this period" },
      };
    }

    // Aggregate each week
    const aggregate = (days: typeof currentWeek) => {
      const totalViews = days.reduce((s, d) => s + d.pageViews, 0);
      const totalVisitors = days.reduce((s, d) => s + d.uniqueVisitors, 0);
      const avgBounce = days.length > 0
        ? Math.round(days.reduce((s, d) => s + (d.bounceRate || 0), 0) / days.length)
        : 0;
      const avgSession = days.length > 0
        ? Math.round(days.reduce((s, d) => s + (d.avgSessionDuration || 0), 0) / days.length)
        : 0;

      // Merge top pages across the week
      const pageMap = new Map<string, number>();
      for (const day of days) {
        for (const p of (day.topPages || [])) {
          pageMap.set(p.page, (pageMap.get(p.page) || 0) + p.views);
        }
      }
      const topPages = Array.from(pageMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([page, views]) => ({ page, views }));

      // Merge referrers
      const refMap = new Map<string, number>();
      for (const day of days) {
        for (const r of (day.topReferrers || [])) {
          refMap.set(r.referrer, (refMap.get(r.referrer) || 0) + r.count);
        }
      }
      const topReferrers = Array.from(refMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([referrer, count]) => ({ referrer, count }));

      // Aggregate device breakdown
      const devices = { desktop: 0, mobile: 0, tablet: 0 };
      for (const day of days) {
        if (day.deviceBreakdown) {
          const db = day.deviceBreakdown as { desktop: number; mobile: number; tablet: number };
          devices.desktop += db.desktop || 0;
          devices.mobile += db.mobile || 0;
          devices.tablet += db.tablet || 0;
        }
      }

      return { totalViews, totalVisitors, avgBounce, avgSession, topPages, topReferrers, devices, daysCount: days.length };
    };

    const current = aggregate(currentWeek);
    const previous = aggregate(previousWeek);

    // Get lead count for context — bounded date range (#16)
    const weekLeads = await storage.getLeadsBySiteIdInDateRange(site.id, weekStart, now);

    const pctChange = (cur: number, prev: number) => {
      if (prev === 0) return cur > 0 ? "+100%" : "0%";
      const change = Math.round(((cur - prev) / prev) * 100);
      return change >= 0 ? `+${change}%` : `${change}%`;
    };

    const analyticsContext = `ANALYTICS DATA (${fmt(weekStart)} to ${fmt(weekEnd)}):

This Week:
- Page views: ${current.totalViews} (${pctChange(current.totalViews, previous.totalViews)} vs prior week)
- Unique visitors: ${current.totalVisitors} (${pctChange(current.totalVisitors, previous.totalVisitors)})
- Avg bounce rate: ${current.avgBounce}% (was ${previous.avgBounce}%)
- Avg session duration: ${current.avgSession}s (was ${previous.avgSession}s)
- Devices: Desktop ${current.devices.desktop}, Mobile ${current.devices.mobile}, Tablet ${current.devices.tablet}
- New leads this week: ${weekLeads.length}

Top Pages:
${current.topPages.map(p => `  - ${p.page}: ${p.views} views`).join("\n") || "  No page data"}

Top Referrers:
${current.topReferrers.map(r => `  - ${r.referrer}: ${r.count} visits`).join("\n") || "  No referrer data"}

Previous Week:
- Page views: ${previous.totalViews}
- Unique visitors: ${previous.totalVisitors}
- Top pages: ${previous.topPages.map(p => `${p.page} (${p.views})`).join(", ") || "none"}`;

    const prompt = `You are a marketing analytics advisor for a local ${site.tradeType || "contractor"} business called "${site.businessName}".

${analyticsContext}

Provide a weekly analytics summary for the business owner. Include:
1. A brief headline summarizing the week's performance
2. Key trends (traffic up/down, which pages are performing, referral sources)
3. Lead generation observations
4. 2-3 specific, actionable recommendations to improve traffic and conversions

Keep the language simple and direct — this is for a busy contractor, not a marketing expert.

Respond with ONLY a JSON object (no markdown):
{
  "headline": "<one-line summary>",
  "highlights": ["<highlight 1>", "<highlight 2>", "<highlight 3>"],
  "trends": "<2-3 sentences on traffic trends>",
  "leadInsight": "<1-2 sentences on lead generation>",
  "recommendations": [
    { "action": "<what to do>", "reason": "<why it matters>" },
    { "action": "<what to do>", "reason": "<why it matters>" }
  ]
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
      const parseResult = insightResponseSchema.safeParse(rawJson);
      if (!parseResult.success) {
        return {
          success: false,
          output: { rawResponse: rawJson, validationErrors: parseResult.error.flatten() },
          error: "AI response failed validation",
          tokensUsed,
        };
      }
      const parsed = parseResult.data;

      log(`Generated insights: "${parsed.headline}"`);

      return {
        success: true,
        output: {
          period: `${fmt(weekStart)} to ${fmt(weekEnd)}`,
          currentWeekStats: current,
          previousWeekStats: previous,
        },
        generatedContent: [{
          contentType: "insight",
          title: `Weekly Insights: ${fmt(weekStart)} to ${fmt(weekEnd)}`,
          content: {
            period: { start: fmt(weekStart), end: fmt(weekEnd) },
            stats: {
              pageViews: current.totalViews,
              pageViewsChange: pctChange(current.totalViews, previous.totalViews),
              visitors: current.totalVisitors,
              visitorsChange: pctChange(current.totalVisitors, previous.totalVisitors),
              bounceRate: current.avgBounce,
              leadsThisWeek: weekLeads.length,
            },
            ...parsed,
          },
        }],
        tokensUsed,
      };
    } catch (error) {
      return {
        success: false,
        output: { period: `${fmt(weekStart)} to ${fmt(weekEnd)}` },
        error: error instanceof Error ? error.message : "AI analytics insight generation failed",
      };
    }
  },
};
