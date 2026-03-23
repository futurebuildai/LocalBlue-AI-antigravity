import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { usePreview } from "@/contexts/PreviewContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertTriangle, Clock, DollarSign } from "lucide-react";

interface BidRecommendation {
  id: number;
  agentType: string;
  contentType: string;
  title: string;
  status: string;
  content: {
    rfqId: number;
    builderName: string;
    projectName: string;
    recommendedTotalCents: number;
    breakdown: {
      materialsCents: number;
      laborCents: number;
      overheadCents: number;
      profitCents: number;
    };
    estimatedDays: number;
    riskLevel: string;
    riskFactors: string[];
    notes: string;
    reasoning: string;
  };
}

interface BidAdvisorPanelProps {
  rfqId: number;
  onApplyBid: (amount: string, days: string, notes: string) => void;
}

const riskColors: Record<string, string> = {
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-red-100 text-red-700 border-red-200",
};

export function BidAdvisorPanel({ rfqId, onApplyBid }: BidAdvisorPanelProps) {
  const { getApiPath } = usePreview();

  const { data: contentPage } = useQuery<{ data: BidRecommendation[]; nextCursor?: number }>({
    queryKey: [getApiPath("/api/tenant/agents/content?status=pending_review")],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  const contentItems = contentPage?.data ?? [];

  // Find the bid proposal for this RFQ
  const recommendation = contentItems.find(
    (c) => c.contentType === "bid_proposal" && c.content?.rfqId === rfqId,
  );

  if (!recommendation) return null;

  const { content } = recommendation;
  const fmt = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const handleApply = () => {
    onApplyBid(
      (content.recommendedTotalCents / 100).toFixed(2),
      content.estimatedDays?.toString() || "",
      content.notes || "",
    );
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          AI Bid Recommendation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recommended total */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Recommended Bid</span>
          <span className="text-xl font-bold">{fmt(content.recommendedTotalCents)}</span>
        </div>

        {/* Breakdown */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Materials</span>
            <span>{fmt(content.breakdown.materialsCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Labor</span>
            <span>{fmt(content.breakdown.laborCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Overhead</span>
            <span>{fmt(content.breakdown.overheadCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Profit</span>
            <span>{fmt(content.breakdown.profitCents)}</span>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap">
          {content.estimatedDays && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {content.estimatedDays} days
            </div>
          )}
          <Badge variant="outline" className={riskColors[content.riskLevel] || ""}>
            {content.riskLevel} risk
          </Badge>
        </div>

        {/* Risk factors */}
        {content.riskFactors && content.riskFactors.length > 0 && (
          <div className="text-xs text-muted-foreground space-y-1">
            {content.riskFactors.map((r, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <AlertTriangle className="h-3 w-3 mt-0.5 text-yellow-500 flex-shrink-0" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        )}

        {/* Reasoning */}
        <p className="text-sm text-muted-foreground italic">{content.reasoning}</p>

        {/* Apply button */}
        <Button onClick={handleApply} className="w-full gap-2">
          <TrendingUp className="h-4 w-4" />
          Apply to Bid Form
        </Button>
      </CardContent>
    </Card>
  );
}
