import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { usePreview } from "@/contexts/PreviewContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, TrendingDown, Users, Eye } from "lucide-react";

interface InsightContent {
  id: number;
  agentType: string;
  contentType: string;
  title: string;
  status: string;
  createdAt: string;
  content: {
    period: { start: string; end: string };
    stats: {
      pageViews: number;
      pageViewsChange: string;
      visitors: number;
      visitorsChange: string;
      bounceRate: number;
      leadsThisWeek: number;
    };
    headline: string;
    highlights: string[];
    trends: string;
    leadInsight: string;
    recommendations: Array<{ action: string; reason: string }>;
  };
}

export function InsightCard() {
  const { getApiPath } = usePreview();

  const { data: contentPage } = useQuery<{ data: InsightContent[]; nextCursor?: number }>({
    queryKey: [getApiPath("/api/tenant/agents/content?status=pending_review")],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  const contentItems = contentPage?.data ?? [];

  // Find the most recent insight
  const insight = contentItems
    .filter(c => c.contentType === "insight")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  if (!insight) return null;

  const { content } = insight;
  const isPositive = (change: string) => change.startsWith("+") && change !== "+0%";
  const isNegative = (change: string) => change.startsWith("-");

  return (
    <Card className="border-amber-500/20 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Weekly AI Insights
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {content.period.start} to {content.period.end}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium">{content.headline}</p>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{content.stats.pageViews} views</span>
            <span className={
              isPositive(content.stats.pageViewsChange) ? "text-green-600 text-xs" :
              isNegative(content.stats.pageViewsChange) ? "text-red-600 text-xs" : "text-muted-foreground text-xs"
            }>
              {content.stats.pageViewsChange}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{content.stats.visitors} visitors</span>
            <span className={
              isPositive(content.stats.visitorsChange) ? "text-green-600 text-xs" :
              isNegative(content.stats.visitorsChange) ? "text-red-600 text-xs" : "text-muted-foreground text-xs"
            }>
              {content.stats.visitorsChange}
            </span>
          </div>
        </div>

        {/* Highlights */}
        {content.highlights && content.highlights.length > 0 && (
          <div className="space-y-1">
            {content.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{h}</span>
              </div>
            ))}
          </div>
        )}

        {/* Top recommendation */}
        {content.recommendations && content.recommendations.length > 0 && (
          <div className="p-2 rounded-md bg-background border text-sm">
            <span className="font-medium text-xs text-amber-600 uppercase tracking-wide">Top Recommendation</span>
            <p className="mt-1">{content.recommendations[0].action}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{content.recommendations[0].reason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
