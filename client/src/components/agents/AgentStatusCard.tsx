import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePreview } from "@/contexts/PreviewContext";

interface AgentConfig {
  id: number;
  agentType: string;
  enabled: boolean;
  schedule: string;
  lastRunAt: string | null;
}

interface AgentExecution {
  agentType: string;
  status: string;
}

const AGENT_LABELS: Record<string, { name: string; description: string; scheduleLabel: string }> = {
  lead_scorer: { name: "Lead Scorer", description: "Scores inbound leads and suggests follow-up actions", scheduleLabel: "On new lead" },
  content_optimizer: { name: "Content Optimizer", description: "Monthly content refresh and SEO improvements", scheduleLabel: "Monthly" },
  seo_agent: { name: "SEO Agent", description: "Keyword research and page-level SEO optimization", scheduleLabel: "Monthly" },
  bid_advisor: { name: "Bid Advisor", description: "Analyzes RFQs and recommends competitive bid amounts", scheduleLabel: "On new RFQ" },
  outreach_agent: { name: "Outreach Agent", description: "Drafts outreach emails to local builders/GCs", scheduleLabel: "Weekly" },
  analytics_insights: { name: "Analytics Insights", description: "Weekly traffic insights and recommendations", scheduleLabel: "Weekly" },
};

interface AgentStatusCardProps {
  config: AgentConfig;
  recentExecutions: AgentExecution[];
}

export function AgentStatusCard({ config, recentExecutions }: AgentStatusCardProps) {
  const { toast } = useToast();
  const { getApiPath } = usePreview();
  const label = AGENT_LABELS[config.agentType] || { name: config.agentType, description: "", scheduleLabel: config.schedule };

  const agentExecs = recentExecutions.filter(e => e.agentType === config.agentType);
  const completedCount = agentExecs.filter(e => e.status === "completed").length;
  const failedCount = agentExecs.filter(e => e.status === "failed").length;

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("PATCH", getApiPath(`/api/tenant/agents/${config.agentType}/config`), { enabled });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/agents/configs")] });
    },
  });

  const triggerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", getApiPath(`/api/tenant/agents/${config.agentType}/trigger`));
      return res.json();
    },
    onSuccess: () => {
      toast({ title: `${label.name} triggered`, description: "The agent will run shortly." });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/agents/executions")] });
      // Refresh configs to update lastRunAt after a delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/agents/configs")] });
      }, 5000);
    },
    onError: () => {
      toast({ title: "Failed to trigger agent", variant: "destructive" });
    },
  });

  const formatLastRun = (dateStr: string | null) => {
    if (!dateStr) return "Awaiting first run";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label.name}</CardTitle>
        <Switch
          checked={config.enabled}
          onCheckedChange={(checked) => toggleMutation.mutate(checked)}
          disabled={toggleMutation.isPending}
        />
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">{label.description}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatLastRun(config.lastRunAt)}</span>
          </div>
          <Badge variant="outline" className="text-xs">{label.scheduleLabel}</Badge>
          {completedCount > 0 && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              <span>{completedCount}</span>
            </div>
          )}
          {failedCount > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <XCircle className="h-3 w-3" />
              <span>{failedCount}</span>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => triggerMutation.mutate()}
          disabled={!config.enabled || triggerMutation.isPending}
        >
          {triggerMutation.isPending ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Play className="h-3 w-3 mr-1" />
          )}
          Run Now
        </Button>
      </CardContent>
    </Card>
  );
}
