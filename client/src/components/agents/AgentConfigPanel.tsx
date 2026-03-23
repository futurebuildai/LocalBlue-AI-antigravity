import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePreview } from "@/contexts/PreviewContext";

interface AgentConfig {
  id: number;
  agentType: string;
  enabled: boolean;
  schedule: string;
  preferences: Record<string, any> | null;
}

const AGENT_NAMES: Record<string, string> = {
  lead_scorer: "Lead Scorer",
  content_optimizer: "Content Optimizer",
  seo_agent: "SEO Agent",
  bid_advisor: "Bid Advisor",
  outreach_agent: "Outreach Agent",
  analytics_insights: "Analytics Insights",
};

const SCHEDULE_OPTIONS = [
  { value: "on_event", label: "On Event", description: "Runs when triggered by an action" },
  { value: "daily", label: "Daily", description: "Runs once per day" },
  { value: "weekly", label: "Weekly", description: "Runs once per week" },
  { value: "monthly", label: "Monthly", description: "Runs once per month" },
];

interface AgentConfigPanelProps {
  config: AgentConfig;
}

export function AgentConfigPanel({ config }: AgentConfigPanelProps) {
  const { toast } = useToast();
  const { getApiPath } = usePreview();
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(config.enabled);
  const [schedule, setSchedule] = useState(config.schedule);

  const updateMutation = useMutation({
    mutationFn: async (data: { enabled?: boolean; schedule?: string }) => {
      const res = await apiRequest("PATCH", getApiPath(`/api/tenant/agents/${config.agentType}/config`), data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Agent configuration updated" });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/agents/configs")] });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update config", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ enabled, schedule });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{AGENT_NAMES[config.agentType] || config.agentType}</DialogTitle>
          <DialogDescription>Configure agent behavior and schedule</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="agent-enabled" className="text-sm font-medium">Enabled</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Agent will run on its schedule when enabled</p>
            </div>
            <Switch
              id="agent-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Schedule</Label>
            <Select value={schedule} onValueChange={setSchedule}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHEDULE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div>
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">— {opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full"
          >
            {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
