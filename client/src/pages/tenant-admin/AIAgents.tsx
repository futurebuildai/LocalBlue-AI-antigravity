import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { usePreview } from "@/contexts/PreviewContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentStatusCard } from "@/components/agents/AgentStatusCard";
import { AgentActivityFeed } from "@/components/agents/AgentActivityFeed";
import { AgentContentReview } from "@/components/agents/AgentContentReview";
import { Bot, Activity, FileCheck } from "lucide-react";

// API response types (JSON wire format — dates serialized as strings)
interface AgentConfigResponse {
  id: number;
  agentType: string;
  enabled: boolean;
  schedule: string;
  lastRunAt: string | null;
}

interface AgentExecutionResponse {
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

interface GeneratedContentResponse {
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

interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: number;
}

export default function AIAgents() {
  const { getApiPath } = usePreview();

  const { data: configs = [] } = useQuery<AgentConfigResponse[]>({
    queryKey: [getApiPath("/api/tenant/agents/configs")],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: executionsPage } = useQuery<PaginatedResponse<AgentExecutionResponse>>({
    queryKey: [getApiPath("/api/tenant/agents/executions")],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  const executions = executionsPage?.data ?? [];

  const { data: contentPage } = useQuery<PaginatedResponse<GeneratedContentResponse>>({
    queryKey: [getApiPath("/api/tenant/agents/content")],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  const content = contentPage?.data ?? [];

  const pendingCount = content.filter(c => c.status === "pending_review").length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6" />
          AI Agents
        </h1>
        <p className="text-muted-foreground mt-1">
          AI agents work in the background to score leads, optimize content, and grow your business.
        </p>
      </div>

      {/* Agent Status Grid */}
      {configs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configs.map((config) => (
            <AgentStatusCard
              key={config.id}
              config={config}
              recentExecutions={executions}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Bot className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              No AI agents configured yet. Agents are automatically set up when you create your site.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Activity & Review */}
      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity" className="gap-1">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-1">
            <FileCheck className="h-4 w-4" />
            Review Queue
            {pendingCount > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Agent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <AgentActivityFeed executions={executions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <AgentContentReview items={content} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
