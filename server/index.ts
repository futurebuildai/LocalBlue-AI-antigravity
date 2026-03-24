import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { seedDatabase } from "./seed";
import { getStripeClient } from "./stripeClient";
import { AgentRunner } from "./agents/runner";
import { storage } from "./storage";
import Anthropic from "@anthropic-ai/sdk";
import pino from "pino";
import pinoHttp from "pino-http";

export const logger = pino({
  transport: process.env.NODE_ENV !== "production" ? {
    target: "pino-pretty",
    options: { colorize: true }
  } : undefined,
});
const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  logger.info({ source }, message);
}

// Register Stripe webhook route BEFORE express.json()
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        log('STRIPE WEBHOOK ERROR: req.body is not a Buffer', 'stripe');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        log('STRIPE_WEBHOOK_SECRET not configured', 'stripe');
        return res.status(500).json({ error: 'Webhook not configured' });
      }

      const stripe = getStripeClient();
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

      // Handle relevant events
      switch (event.type) {
        case 'checkout.session.completed':
          log(`Checkout completed: ${event.data.object.id}`, 'stripe');
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          log(`Subscription ${event.type}: ${(event.data.object as any).id}`, 'stripe');
          break;
        case 'invoice.paid':
          log(`Invoice paid: ${(event.data.object as any).id}`, 'stripe');
          break;
        case 'invoice.payment_failed':
          log(`Invoice payment failed: ${(event.data.object as any).id}`, 'stripe');
          break;
        default:
          log(`Unhandled Stripe event: ${event.type}`, 'stripe');
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      log(`Webhook error: ${error.message}`, 'stripe');
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

// Now apply JSON middleware for all other routes
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.use(pinoHttp({
  logger,
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn'
    } else if (res.statusCode >= 500 || err) {
      return 'error'
    }
    return 'info'
  },
}));

(async () => {
  await registerRoutes(httpServer, app);

  // Seed the database with sample data
  await seedDatabase();

  // Initialize and start the AI agent runner
  let agentRunner: AgentRunner | null = null;
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
    });
    agentRunner = new AgentRunner(storage, anthropic);
    // Explicitly import registry to ensure all agents are registered (#21)
    await import("./agents/registry");
    agentRunner.start();
    app.set("agentRunner", agentRunner);
  } catch (err) {
    logger.error({ err }, "Failed to initialize AgentRunner — server will run without agent capabilities");
  }

  // Graceful shutdown: drain in-flight execution before closing (#17)
  const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, "Received shutdown signal, draining...");
    if (agentRunner) await agentRunner.stop();
    httpServer.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
    // Force exit after 35s if drain takes too long
    setTimeout(() => process.exit(1), 35_000).unref();
  };
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error({ err, path: _req.path }, "Internal Server Error");

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
