import type { AgentType, AgentExecution } from "@shared/schema";
import type { IStorage } from "../storage";
import type Anthropic from "@anthropic-ai/sdk";
import { getAgent } from "./registry";
import { logger } from "../index";

const POLL_INTERVAL_MS = 30_000;
const SCHEDULE_CHECK_INTERVAL_MS = 60_000;
const EXECUTION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes max per agent
const MAX_RETRIES = 2;
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // daily
const CLEANUP_OLDER_THAN_DAYS = 90;

export class AgentRunner {
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private scheduleTimer: ReturnType<typeof setInterval> | null = null;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private processing = false; // simple guard for single-threaded Node
  private stopping = false;
  private currentExecution: Promise<void> | null = null;

  constructor(
    private storage: IStorage,
    private anthropic: Anthropic,
  ) {}

  start(): void {
    this.stopping = false;
    logger.info("AgentRunner started");
    this.pollTimer = setInterval(() => this.poll(), POLL_INTERVAL_MS);
    this.scheduleTimer = setInterval(() => this.checkSchedules(), SCHEDULE_CHECK_INTERVAL_MS);
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
    // Recover any stale running executions from previous crash
    this.storage.markStaleRunningExecutions(EXECUTION_TIMEOUT_MS * 2)
      .then(count => { if (count > 0) logger.warn({ count }, "Recovered stale running executions"); })
      .catch(err => logger.error({ err }, "Failed to recover stale executions"));
    // Initial poll
    this.poll();
  }

  async stop(): Promise<void> {
    this.stopping = true;
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.scheduleTimer) clearInterval(this.scheduleTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.pollTimer = null;
    this.scheduleTimer = null;
    this.cleanupTimer = null;
    // Wait for in-flight execution to finish (with timeout)
    if (this.currentExecution) {
      logger.info("Waiting for in-flight agent execution to complete...");
      const drainTimeout = new Promise<void>(resolve => setTimeout(resolve, 30_000));
      await Promise.race([this.currentExecution, drainTimeout]);
    }
    // Mark any remaining running executions as failed
    await this.storage.markStaleRunningExecutions(0).catch(() => {});
    logger.info("AgentRunner stopped");
  }

  async triggerAgent(siteId: string, agentType: AgentType, input?: Record<string, any>): Promise<AgentExecution> {
    // Dedup: don't create if already pending/running (#6)
    const exists = await this.storage.hasPendingOrRunningExecution(siteId, agentType);
    if (exists) {
      // Return the existing execution rather than creating a duplicate
      const recent = await this.storage.getAgentExecutionsBySite(siteId, 10);
      const match = recent.find(e => e.agentType === agentType && (e.status === "pending" || e.status === "running"));
      if (match) return match;
    }
    const execution = await this.storage.createAgentExecution({
      siteId,
      agentType,
      status: "pending",
      trigger: "event",
      input: input || {},
    });
    this.poll();
    return execution;
  }

  async triggerManual(siteId: string, agentType: AgentType): Promise<AgentExecution> {
    // Dedup: don't create if already pending/running (#6)
    const exists = await this.storage.hasPendingOrRunningExecution(siteId, agentType);
    if (exists) {
      const pending = await this.storage.getAgentExecutionsBySite(siteId, 5);
      const match = pending.find(e => e.agentType === agentType && (e.status === "pending" || e.status === "running"));
      if (match) return match;
    }
    const execution = await this.storage.createAgentExecution({
      siteId,
      agentType,
      status: "pending",
      trigger: "manual",
      input: {},
    });
    this.poll();
    return execution;
  }

  private async poll(): Promise<void> {
    if (this.processing || this.stopping) return;
    this.processing = true;

    try {
      // Use atomic claim with FOR UPDATE SKIP LOCKED (#3)
      const execution = await this.storage.claimPendingExecution();
      if (!execution) return;

      // Track the promise for graceful shutdown (#17)
      this.currentExecution = this.executeAgent(execution);
      await this.currentExecution;
      this.currentExecution = null;
    } catch (error) {
      logger.error({ error }, "AgentRunner poll error");
      this.currentExecution = null;
    } finally {
      this.processing = false;
    }
  }

  private async executeAgent(execution: AgentExecution): Promise<void> {
    const agent = getAgent(execution.agentType);
    if (!agent) {
      await this.storage.updateAgentExecution(execution.id, {
        status: "failed",
        error: `Unknown agent type: ${execution.agentType}`,
        completedAt: new Date(),
      });
      return;
    }

    const site = await this.storage.getSite(execution.siteId);
    if (!site) {
      await this.storage.updateAgentExecution(execution.id, {
        status: "failed",
        error: `Site not found: ${execution.siteId}`,
        completedAt: new Date(),
      });
      return;
    }

    const config = await this.storage.getAgentConfig(execution.siteId, execution.agentType);
    if (!config || !config.enabled) {
      await this.storage.updateAgentExecution(execution.id, {
        status: "cancelled",
        error: "Agent disabled",
        completedAt: new Date(),
      });
      return;
    }

    // execution was already marked 'running' by claimPendingExecution
    const startedAt = execution.startedAt || new Date();

    try {
      // Execute with timeout (#1) — clear timer on completion to avoid leaks
      let timeoutHandle: ReturnType<typeof setTimeout>;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(`Agent execution timed out after ${EXECUTION_TIMEOUT_MS / 1000}s`)), EXECUTION_TIMEOUT_MS);
      });

      const result = await Promise.race([
        agent.execute({
          site,
          config,
          storage: this.storage,
          anthropic: this.anthropic,
          execution,
          log: (msg: string) => logger.info({ agentType: execution.agentType, siteId: execution.siteId }, msg),
        }),
        timeoutPromise,
      ]);
      clearTimeout(timeoutHandle!);

      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      // Persist generated content items
      if (result.generatedContent && result.generatedContent.length > 0) {
        for (const item of result.generatedContent) {
          await this.storage.createGeneratedContent({
            siteId: execution.siteId,
            executionId: execution.id,
            agentType: execution.agentType,
            contentType: item.contentType,
            targetPage: item.targetPage || null,
            title: item.title,
            content: item.content,
            currentContent: item.currentContent || {},
            status: "pending_review",
          });
        }
      }

      await this.storage.updateAgentExecution(execution.id, {
        status: result.success ? "completed" : "failed",
        output: result.output,
        error: result.error || null,
        tokensUsed: result.tokensUsed || 0,
        durationMs,
        completedAt,
      });

      // Update lastRunAt on config
      await this.storage.upsertAgentConfig({
        siteId: config.siteId,
        agentType: config.agentType,
        lastRunAt: completedAt,
      });

      logger.info({
        agentType: execution.agentType,
        siteId: execution.siteId,
        durationMs,
        success: result.success,
        tokensUsed: result.tokensUsed,
      }, "Agent execution completed");

      // If failed and retriable, schedule retry (#11)
      if (!result.success && (execution.retryCount ?? 0) < MAX_RETRIES) {
        await this.storage.createAgentExecution({
          siteId: execution.siteId,
          agentType: execution.agentType,
          status: "pending",
          trigger: execution.trigger,
          input: execution.input as Record<string, any>,
          retryCount: (execution.retryCount ?? 0) + 1,
        });
        logger.info({
          agentType: execution.agentType,
          siteId: execution.siteId,
          retryCount: (execution.retryCount ?? 0) + 1,
        }, "Scheduling agent retry");
      }

    } catch (error) {
      const completedAt = new Date();
      await this.storage.updateAgentExecution(execution.id, {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        durationMs: completedAt.getTime() - startedAt.getTime(),
        completedAt,
      });
      logger.error({ error, agentType: execution.agentType, siteId: execution.siteId }, "Agent execution failed");

      // Retry on hard failure (#11)
      if ((execution.retryCount ?? 0) < MAX_RETRIES) {
        await this.storage.createAgentExecution({
          siteId: execution.siteId,
          agentType: execution.agentType,
          status: "pending",
          trigger: execution.trigger,
          input: execution.input as Record<string, any>,
          retryCount: (execution.retryCount ?? 0) + 1,
        });
        logger.info({
          agentType: execution.agentType,
          retryCount: (execution.retryCount ?? 0) + 1,
        }, "Scheduling agent retry after crash");
      }
    }
  }

  // Efficient schedule check: single query instead of N+1 (#2)
  private async checkSchedules(): Promise<void> {
    if (this.stopping) return;
    try {
      const overdueConfigs = await this.storage.getOverdueScheduledConfigs();

      for (const config of overdueConfigs) {
        // Dedup: skip if already pending/running (#18)
        const exists = await this.storage.hasPendingOrRunningExecution(config.siteId, config.agentType);
        if (exists) continue;

        await this.storage.createAgentExecution({
          siteId: config.siteId,
          agentType: config.agentType,
          status: "pending",
          trigger: "scheduled",
          input: {},
        });
        logger.info({ agentType: config.agentType, siteId: config.siteId }, "Scheduled agent execution created");
      }
    } catch (error) {
      logger.error({ error }, "Schedule check error");
    }
  }

  // Periodic cleanup of old data (#25)
  private async cleanup(): Promise<void> {
    try {
      const deleted = await this.storage.cleanupOldExecutions(CLEANUP_OLDER_THAN_DAYS);
      if (deleted > 0) {
        logger.info({ deleted }, "Cleaned up old agent executions");
      }
    } catch (error) {
      logger.error({ error }, "Cleanup error");
    }
  }
}
