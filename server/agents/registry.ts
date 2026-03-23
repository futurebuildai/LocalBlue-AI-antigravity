import type { AgentType } from "@shared/schema";
import type { Agent } from "./types";
import { leadScorer } from "./leadScorer";
import { bidAdvisor } from "./bidAdvisor";
import { analyticsInsights } from "./analyticsInsights";
import { contentOptimizer } from "./contentOptimizer";
import { seoAgent } from "./seoAgent";
import { outreachAgent } from "./outreachAgent";

const agents = new Map<AgentType, Agent>();

export function registerAgent(agent: Agent): void {
  agents.set(agent.type, agent);
}

export function getAgent(type: AgentType): Agent | undefined {
  return agents.get(type);
}

export function getAllAgents(): Agent[] {
  return Array.from(agents.values());
}

// Register all built-in agents
registerAgent(leadScorer);
registerAgent(bidAdvisor);
registerAgent(analyticsInsights);
registerAgent(contentOptimizer);
registerAgent(seoAgent);
registerAgent(outreachAgent);
