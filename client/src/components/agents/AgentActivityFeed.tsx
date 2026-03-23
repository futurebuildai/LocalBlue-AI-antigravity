import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Clock, Zap, CalendarClock, Hand } from "lucide-react";

interface AgentExecution {
  id: number;
  agentType: string;
  status: string;
  trigger: string;
  tokensUsed: number;
  durationMs: number;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

const AGENT_NAMES: Record<string, string> = {
  lead_scorer: "Lead Scorer",
  content_optimizer: "Content Optimizer",
  seo_agent: "SEO Agent",
  bid_advisor: "Bid Advisor",
  outreach_agent: "Outreach Agent",
  analytics_insights: "Analytics Insights",
};

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  completed: { icon: CheckCircle2, color: "text-green-600", label: "Completed" },
  failed: { icon: XCircle, color: "text-red-600", label: "Failed" },
  running: { icon: Loader2, color: "text-blue-600", label: "Running" },
  pending: { icon: Clock, color: "text-yellow-600", label: "Pending" },
  cancelled: { icon: XCircle, color: "text-gray-400", label: "Cancelled" },
};

const triggerIcons: Record<string, typeof Zap> = {
  event: Zap,
  scheduled: CalendarClock,
  manual: Hand,
};

interface AgentActivityFeedProps {
  executions: AgentExecution[];
  limit?: number;
}

export function AgentActivityFeed({ executions, limit }: AgentActivityFeedProps) {
  const items = limit ? executions.slice(0, limit) : executions;

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">No agent activity yet</p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((exec) => {
        const cfg = statusConfig[exec.status] || statusConfig.pending;
        const StatusIcon = cfg.icon;
        const TriggerIcon = triggerIcons[exec.trigger] || Zap;
        const timeAgo = formatTimeAgo(exec.createdAt);

        return (
          <div key={exec.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50">
            <StatusIcon className={`h-4 w-4 flex-shrink-0 ${cfg.color} ${exec.status === "running" ? "animate-spin" : ""}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {AGENT_NAMES[exec.agentType] || exec.agentType}
              </p>
              {exec.error && (
                <p className="text-xs text-red-500 truncate">{exec.error}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <TriggerIcon className="h-3 w-3 text-muted-foreground" />
              {exec.durationMs > 0 && (
                <span className="text-xs text-muted-foreground">{(exec.durationMs / 1000).toFixed(1)}s</span>
              )}
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d`;
}
