import type { Site, AgentConfig, AgentExecution, AgentType } from "@shared/schema";
import type { IStorage } from "../storage";
import type Anthropic from "@anthropic-ai/sdk";

export interface AgentContext {
  site: Site;
  config: AgentConfig;
  storage: IStorage;
  anthropic: Anthropic;
  execution: AgentExecution;
  log: (message: string) => void;
}

export interface GeneratedContentItem {
  contentType: string;
  targetPage?: string;
  title: string;
  content: Record<string, any>;
  currentContent?: Record<string, any>;
}

export interface AgentResult {
  success: boolean;
  output: Record<string, any>;
  generatedContent?: GeneratedContentItem[];
  tokensUsed?: number;
  error?: string;
}

export interface Agent {
  type: AgentType;
  name: string;
  description: string;
  defaultSchedule: "on_event" | "daily" | "weekly" | "monthly";
  execute(context: AgentContext): Promise<AgentResult>;
}
