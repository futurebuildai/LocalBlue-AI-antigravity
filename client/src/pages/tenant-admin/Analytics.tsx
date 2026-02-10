import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye, Users, Clock, ArrowDownRight, Monitor, Smartphone, Tablet,
  BarChart3, Search, Globe, TrendingUp, Lightbulb, FileText, ArrowUpRight
} from "lucide-react";
import { usePreview } from "@/contexts/PreviewContext";
import type { AnalyticsDaily, SeoMetric, SeoOptimization } from "@shared/schema";

interface AnalyticsSummary {
  dailyData: AnalyticsDaily[];
  totals: {
    pageViews: number;
    uniqueVisitors: number;
    avgDuration: number;
    bounceRate: number;
  };
}

type DateRange = "7" | "30" | "90";

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function getDateRange(days: DateRange): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - parseInt(days));
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TrafficChart({ dailyData }: { dailyData: AnalyticsDaily[] }) {
  const sorted = [...dailyData].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return null;

  const values = sorted.map((d) => d.pageViews);
  const maxVal = Math.max(...values, 1);
  const chartWidth = 800;
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const points = sorted.map((d, i) => {
    const x = padding.left + (sorted.length > 1 ? (i / (sorted.length - 1)) * innerW : innerW / 2);
    const y = padding.top + innerH - (d.pageViews / maxVal) * innerH;
    return { x, y, date: d.date, views: d.pageViews };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  const areaPath =
    `M ${points[0].x},${padding.top + innerH} ` +
    points.map((p) => `L ${p.x},${p.y}`).join(" ") +
    ` L ${points[points.length - 1].x},${padding.top + innerH} Z`;

  const yTicks = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];

  const labelInterval = Math.max(1, Math.floor(sorted.length / 6));

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
      data-testid="chart-traffic"
    >
      {yTicks.map((tick) => {
        const y = padding.top + innerH - (tick / maxVal) * innerH;
        return (
          <g key={tick}>
            <line
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              className="stroke-muted"
              strokeWidth="0.5"
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize="10"
            >
              {formatNumber(tick)}
            </text>
          </g>
        );
      })}

      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />
      <polyline
        points={polyline}
        fill="none"
        className="stroke-primary"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" className="fill-primary" />
      ))}

      {sorted.map((d, i) => {
        if (i % labelInterval !== 0 && i !== sorted.length - 1) return null;
        const x = points[i].x;
        return (
          <text
            key={d.date}
            x={x}
            y={chartHeight - 8}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize="9"
          >
            {formatShortDate(d.date)}
          </text>
        );
      })}
    </svg>
  );
}

function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-20 mb-1" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const [range, setRange] = useState<DateRange>("30");
  const { startDate, endDate } = getDateRange(range);
  const { getApiPath } = usePreview();

  const {
    data: summary,
    isLoading: summaryLoading,
  } = useQuery<AnalyticsSummary>({
    queryKey: [getApiPath("/api/tenant/analytics/summary"), `?startDate=${startDate}&endDate=${endDate}`],
  });

  const { data: seoMetrics = [], isLoading: seoLoading } = useQuery<SeoMetric[]>({
    queryKey: [getApiPath("/api/tenant/seo/metrics")],
  });

  const { data: seoOptimizations = [], isLoading: optLoading } = useQuery<SeoOptimization[]>({
    queryKey: [getApiPath("/api/tenant/seo/optimizations")],
  });

  const dailyData = summary?.dailyData ?? [];
  const totals = summary?.totals;

  const topPages = useMemo(() => {
    const map = new Map<string, number>();
    for (const day of dailyData) {
      for (const p of day.topPages ?? []) {
        map.set(p.page, (map.get(p.page) ?? 0) + p.views);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [dailyData]);

  const topReferrers = useMemo(() => {
    const map = new Map<string, number>();
    for (const day of dailyData) {
      for (const r of day.topReferrers ?? []) {
        const label = r.referrer || "Direct";
        map.set(label, (map.get(label) ?? 0) + r.count);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [dailyData]);

  const deviceTotals = useMemo(() => {
    const totals = { desktop: 0, mobile: 0, tablet: 0 };
    for (const day of dailyData) {
      const db = day.deviceBreakdown as { desktop: number; mobile: number; tablet: number } | null;
      if (db) {
        totals.desktop += db.desktop;
        totals.mobile += db.mobile;
        totals.tablet += db.tablet;
      }
    }
    return totals;
  }, [dailyData]);

  const deviceTotal = deviceTotals.desktop + deviceTotals.mobile + deviceTotals.tablet;

  const currentMonthSeo = useMemo(() => {
    if (seoMetrics.length === 0) return null;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return seoMetrics.find((m) => m.month === currentMonth) ?? seoMetrics[seoMetrics.length - 1];
  }, [seoMetrics]);

  const hasAnalytics = dailyData.length > 0;
  const hasSeo = seoMetrics.length > 0;

  const rangeOptions: { label: string; value: DateRange }[] = [
    { label: "7 days", value: "7" },
    { label: "30 days", value: "30" },
    { label: "90 days", value: "90" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1
            className="text-xl sm:text-2xl font-semibold tracking-tight"
            data-testid="text-analytics-title"
          >
            Analytics
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track your website traffic and search performance
          </p>
        </div>
        <div className="flex items-center gap-1" data-testid="group-date-range">
          {rangeOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={range === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(opt.value)}
              data-testid={`button-range-${opt.value}`}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {summaryLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      ) : !hasAnalytics ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium" data-testid="text-no-analytics">No analytics data yet</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              No analytics data yet. Traffic data will appear once visitors start viewing your site.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card data-testid="card-metric-pageviews">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Page Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-metric-pageviews">
                  {formatNumber(totals?.pageViews ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  Last {range} days
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-metric-visitors">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Unique Visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-metric-visitors">
                  {formatNumber(totals?.uniqueVisitors ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last {range} days
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-metric-duration">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Session Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-metric-duration">
                  {formatDuration(totals?.avgDuration ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last {range} days
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-metric-bounce">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Bounce Rate</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-metric-bounce">
                  {totals?.bounceRate ?? 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last {range} days
                </p>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-traffic-chart">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Traffic Overview</CardTitle>
              <CardDescription className="text-sm">Daily page views over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <TrafficChart dailyData={dailyData} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <Card data-testid="card-top-pages">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Top Pages</CardTitle>
                <CardDescription className="text-sm">Most viewed pages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topPages.length > 0 ? (
                  topPages.map(([page, views], i) => {
                    const maxViews = topPages[0][1];
                    const pct = maxViews > 0 ? (views / maxViews) * 100 : 0;
                    return (
                      <div key={page} className="space-y-1" data-testid={`row-top-page-${i}`}>
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate font-medium">{page}</span>
                          <span className="text-muted-foreground flex-shrink-0">{formatNumber(views)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No page data available</p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-traffic-sources">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Traffic Sources</CardTitle>
                <CardDescription className="text-sm">Where your visitors come from</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topReferrers.length > 0 ? (
                  topReferrers.map(([referrer, count], i) => {
                    const maxCount = topReferrers[0][1];
                    const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    return (
                      <div key={referrer} className="space-y-1" data-testid={`row-referrer-${i}`}>
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate font-medium">{referrer}</span>
                          <span className="text-muted-foreground flex-shrink-0">{formatNumber(count)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary/70"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No referrer data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {deviceTotal > 0 && (
            <Card data-testid="card-device-breakdown">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Device Breakdown</CardTitle>
                <CardDescription className="text-sm">Visitors by device type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex h-4 rounded-full overflow-hidden">
                  {deviceTotals.desktop > 0 && (
                    <div
                      className="bg-blue-500"
                      style={{ width: `${(deviceTotals.desktop / deviceTotal) * 100}%` }}
                      data-testid="bar-device-desktop"
                    />
                  )}
                  {deviceTotals.mobile > 0 && (
                    <div
                      className="bg-green-500"
                      style={{ width: `${(deviceTotals.mobile / deviceTotal) * 100}%` }}
                      data-testid="bar-device-mobile"
                    />
                  )}
                  {deviceTotals.tablet > 0 && (
                    <div
                      className="bg-amber-500"
                      style={{ width: `${(deviceTotals.tablet / deviceTotal) * 100}%` }}
                      data-testid="bar-device-tablet"
                    />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2" data-testid="legend-desktop">
                    <Monitor className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Desktop</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(deviceTotals.desktop)} ({deviceTotal > 0 ? Math.round((deviceTotals.desktop / deviceTotal) * 100) : 0}%)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" data-testid="legend-mobile">
                    <Smartphone className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Mobile</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(deviceTotals.mobile)} ({deviceTotal > 0 ? Math.round((deviceTotals.mobile / deviceTotal) * 100) : 0}%)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" data-testid="legend-tablet">
                    <Tablet className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Tablet</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(deviceTotals.tablet)} ({deviceTotal > 0 ? Math.round((deviceTotals.tablet / deviceTotal) * 100) : 0}%)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight" data-testid="text-seo-heading">
          SEO Insights
        </h2>

        {seoLoading ? (
          <Card>
            <CardContent className="py-8 space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ) : !hasSeo ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium" data-testid="text-no-seo">No SEO data yet</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                SEO metrics will be available after your first month.
              </p>
            </CardContent>
          </Card>
        ) : currentMonthSeo ? (
          <Card data-testid="card-seo-keywords">
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-base sm:text-lg">Keyword Performance</CardTitle>
                  <CardDescription className="text-sm">
                    Month: {currentMonthSeo.month}
                  </CardDescription>
                </div>
                <Badge variant="secondary" data-testid="badge-seo-month">{currentMonthSeo.month}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(currentMonthSeo.keywords as Array<{ keyword: string; position: number | null; impressions: number; clicks: number }>)?.length > 0 ? (
                <div className="overflow-x-auto -mx-3 sm:-mx-6">
                  <table className="w-full text-sm min-w-[400px]" data-testid="table-keywords">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left font-medium text-muted-foreground py-2 px-3 sm:px-6">Keyword</th>
                        <th className="text-right font-medium text-muted-foreground py-2 px-3 sm:px-6">Position</th>
                        <th className="text-right font-medium text-muted-foreground py-2 px-3 sm:px-6">Impressions</th>
                        <th className="text-right font-medium text-muted-foreground py-2 px-3 sm:px-6">Clicks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(currentMonthSeo.keywords as Array<{ keyword: string; position: number | null; impressions: number; clicks: number }>).map(
                        (kw, i) => (
                          <tr key={i} className="border-b last:border-b-0" data-testid={`row-keyword-${i}`}>
                            <td className="py-2 px-3 sm:px-6 font-medium">{kw.keyword}</td>
                            <td className="py-2 px-3 sm:px-6 text-right text-muted-foreground">
                              {kw.position != null ? kw.position : "--"}
                            </td>
                            <td className="py-2 px-3 sm:px-6 text-right text-muted-foreground">
                              {formatNumber(kw.impressions)}
                            </td>
                            <td className="py-2 px-3 sm:px-6 text-right text-muted-foreground">
                              {formatNumber(kw.clicks)}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No keyword data available for this month.</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50" data-testid="stat-organic-traffic">
                  <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Organic Traffic</p>
                    <p className="text-lg font-semibold">{formatNumber(currentMonthSeo.organicTraffic ?? 0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50" data-testid="stat-total-leads">
                  <TrendingUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Leads (Organic)</p>
                    <p className="text-lg font-semibold">{formatNumber(currentMonthSeo.totalLeads ?? 0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50" data-testid="stat-conversion-rate">
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Conversion Rate</p>
                    <p className="text-lg font-semibold">{currentMonthSeo.conversionRate ?? 0}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight" data-testid="text-optimizations-heading">
          Optimization History
        </h2>

        {optLoading ? (
          <Card>
            <CardContent className="py-8 space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ) : seoOptimizations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium" data-testid="text-no-optimizations">No optimizations yet</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                AI-driven SEO optimizations will appear here as they are applied to your site.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card data-testid="card-optimizations">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Recent Optimizations</CardTitle>
              <CardDescription className="text-sm">AI-driven improvements applied to your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {seoOptimizations.map((opt) => (
                <div
                  key={opt.id}
                  className="p-3 sm:p-4 rounded-lg border bg-card"
                  data-testid={`row-optimization-${opt.id}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" data-testid={`badge-opt-type-${opt.id}`}>
                        {opt.type}
                      </Badge>
                      <Badge
                        variant={opt.status === "applied" ? "default" : "outline"}
                        data-testid={`badge-opt-status-${opt.id}`}
                      >
                        {opt.status}
                      </Badge>
                      {opt.crossSiteInsight && (
                        <Badge variant="outline" className="text-xs" data-testid={`badge-cross-site-${opt.id}`}>
                          Cross-site insight
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground" data-testid={`text-opt-date-${opt.id}`}>
                      {new Date(opt.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-sm" data-testid={`text-opt-desc-${opt.id}`}>
                    {opt.description}
                  </p>
                  {opt.page && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <span data-testid={`text-opt-page-${opt.id}`}>{opt.page}</span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
