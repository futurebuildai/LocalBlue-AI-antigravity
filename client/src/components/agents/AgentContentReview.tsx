import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, FileText, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePreview } from "@/contexts/PreviewContext";
import { ContentDiffView } from "./ContentDiffView";

interface GeneratedContentItem {
  id: number;
  agentType: string;
  contentType: string;
  targetPage: string | null;
  title: string;
  content: Record<string, any>;
  currentContent: Record<string, any>;
  status: string;
  createdAt: string;
}

const AGENT_NAMES: Record<string, string> = {
  lead_scorer: "Lead Scorer",
  content_optimizer: "Content Optimizer",
  seo_agent: "SEO Agent",
  bid_advisor: "Bid Advisor",
  outreach_agent: "Outreach Agent",
  analytics_insights: "Analytics Insights",
};

const contentTypeLabels: Record<string, string> = {
  page_update: "Page Update",
  blog_post: "Blog Post",
  meta_description: "Meta Description",
  bid_proposal: "Bid Proposal",
  outreach_email: "Outreach Email",
  insight: "Insight",
};

interface AgentContentReviewProps {
  items: GeneratedContentItem[];
}

export function AgentContentReview({ items }: AgentContentReviewProps) {
  const pendingItems = items.filter(i => i.status === "pending_review");

  if (pendingItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">No items pending review</p>
    );
  }

  return (
    <div className="space-y-3">
      {pendingItems.map((item) => (
        <ContentReviewCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function ContentReviewCard({ item }: { item: GeneratedContentItem }) {
  const { toast } = useToast();
  const { getApiPath } = usePreview();

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", getApiPath(`/api/tenant/agents/content/${item.id}/approve`));
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Content approved" });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/agents/content")] });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/agents/activity")] });
    },
    onError: () => {
      toast({ title: "Failed to approve", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", getApiPath(`/api/tenant/agents/content/${item.id}/reject`));
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Content rejected" });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/agents/content")] });
    },
    onError: () => {
      toast({ title: "Failed to reject", variant: "destructive" });
    },
  });

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {AGENT_NAMES[item.agentType] || item.agentType}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {contentTypeLabels[item.contentType] || item.contentType}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {item.targetPage && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <FileText className="h-3 w-3" />
            <span>Page: {item.targetPage}</span>
          </div>
        )}

        {/* Content diff for page updates and meta descriptions */}
        {(item.contentType === "page_update" || item.contentType === "meta_description") && (
          <div className="mb-3">
            <ContentDiffView
              title=""
              contentType={item.contentType}
              targetPage={item.targetPage}
              currentContent={item.currentContent}
              proposedContent={item.content}
            />
          </div>
        )}

        {/* Show summary for insights */}
        {item.contentType === "insight" && item.content?.headline && (
          <div className="mb-3 space-y-1">
            <p className="text-sm font-medium">{item.content.headline}</p>
            {item.content.highlights && (
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {(item.content.highlights as string[]).slice(0, 3).map((h: string, i: number) => (
                  <li key={i}>• {h}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {item.contentType === "bid_proposal" && item.content?.recommendedTotalCents && (
          <p className="text-sm mb-3">
            Recommended bid: <strong>${(item.content.recommendedTotalCents / 100).toLocaleString()}</strong>
          </p>
        )}

        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => approveMutation.mutate()}
            disabled={isPending}
          >
            {approveMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => rejectMutation.mutate()}
            disabled={isPending}
          >
            {rejectMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <X className="h-3 w-3 mr-1" />}
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
