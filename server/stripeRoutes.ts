import { Express } from 'express';
import { db } from './db';
import { sites } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { getUncachableStripeClient, getStripePublishableKey } from './stripeClient';

/**
 * Register Stripe-related API routes
 * These handle subscription management, checkout, and billing portal
 */
export function registerStripeRoutes(app: Express) {
  // Get Stripe publishable key for frontend
  app.get('/api/stripe/publishable-key', async (req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get Stripe key' });
    }
  });

  // Get available subscription products and prices
  app.get('/api/stripe/products', async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.metadata as price_metadata
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true 
        AND p.metadata->>'localblue_product' = 'true'
        ORDER BY (p.metadata->>'tier')::int, pr.unit_amount
      `);

      // Group prices by product
      const productsMap = new Map();
      for (const row of result.rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            metadata: row.price_metadata,
          });
        }
      }

      res.json({ products: Array.from(productsMap.values()) });
    } catch (error: any) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  // Create checkout session for a site subscription
  app.post('/api/stripe/checkout', async (req, res) => {
    try {
      const { siteId, priceId } = req.body;
      
      if (!siteId || !priceId) {
        return res.status(400).json({ error: 'Missing siteId or priceId' });
      }

      const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }

      const stripe = await getUncachableStripeClient();

      // Create or get customer
      let customerId = site.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: site.email || undefined,
          name: site.businessName,
          metadata: { siteId: site.id },
        });
        
        await db.update(sites)
          .set({ stripeCustomerId: customer.id })
          .where(eq(sites.id, siteId));
        
        customerId = customer.id;
      }

      // Create checkout session
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/checkout/cancel`,
        metadata: { siteId },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Checkout error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // Create customer portal session for managing subscription
  app.post('/api/stripe/portal', async (req, res) => {
    try {
      const { siteId } = req.body;
      
      if (!siteId) {
        return res.status(400).json({ error: 'Missing siteId' });
      }

      const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
      if (!site?.stripeCustomerId) {
        return res.status(400).json({ error: 'No billing account found' });
      }

      const stripe = await getUncachableStripeClient();
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      
      const session = await stripe.billingPortal.sessions.create({
        customer: site.stripeCustomerId,
        return_url: `${baseUrl}/tenant-admin/settings`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Portal error:', error);
      res.status(500).json({ error: 'Failed to create portal session' });
    }
  });

  // Get subscription status for a site
  app.get('/api/stripe/subscription/:siteId', async (req, res) => {
    try {
      const { siteId } = req.params;
      
      const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }

      if (!site.stripeSubscriptionId) {
        return res.json({ subscription: null, trialPhase: site.trialPhase });
      }

      // Get subscription from synced data
      const result = await db.execute(sql`
        SELECT * FROM stripe.subscriptions WHERE id = ${site.stripeSubscriptionId}
      `);

      res.json({ 
        subscription: result.rows[0] || null,
        trialPhase: site.trialPhase
      });
    } catch (error: any) {
      console.error('Subscription fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch subscription' });
    }
  });

  // Platform Admin: Revenue dashboard data
  app.get('/api/admin/revenue', async (req, res) => {
    try {
      // Get subscription metrics from synced Stripe data
      const subscriptionStats = await db.execute(sql`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
          COUNT(*) FILTER (WHERE status = 'trialing') as trialing_subscriptions,
          COUNT(*) FILTER (WHERE status = 'past_due') as past_due_subscriptions,
          COUNT(*) FILTER (WHERE status = 'canceled') as canceled_subscriptions,
          COALESCE(SUM(CASE WHEN status = 'active' THEN 
            CASE 
              WHEN plan->>'interval' = 'month' THEN (plan->>'amount')::numeric / 100
              WHEN plan->>'interval' = 'year' THEN (plan->>'amount')::numeric / 100 / 12
              ELSE 0 
            END
          ELSE 0 END), 0) as monthly_recurring_revenue
        FROM stripe.subscriptions
      `);

      // Get recent payments
      const recentPayments = await db.execute(sql`
        SELECT 
          pi.id,
          pi.amount,
          pi.currency,
          pi.status,
          pi.created,
          c.email as customer_email,
          c.name as customer_name
        FROM stripe.payment_intents pi
        LEFT JOIN stripe.customers c ON pi.customer = c.id
        WHERE pi.status = 'succeeded'
        ORDER BY pi.created DESC
        LIMIT 10
      `);

      // Get revenue by month (last 6 months)
      const monthlyRevenue = await db.execute(sql`
        SELECT 
          DATE_TRUNC('month', to_timestamp(pi.created)) as month,
          SUM(pi.amount) / 100 as revenue,
          COUNT(*) as transaction_count
        FROM stripe.payment_intents pi
        WHERE pi.status = 'succeeded'
        AND pi.created > EXTRACT(EPOCH FROM NOW() - INTERVAL '6 months')
        GROUP BY DATE_TRUNC('month', to_timestamp(pi.created))
        ORDER BY month DESC
      `);

      // Get customer count
      const customerStats = await db.execute(sql`
        SELECT COUNT(*) as total_customers FROM stripe.customers
      `);

      // Get site subscription breakdown
      const siteSubscriptions = await db.execute(sql`
        SELECT 
          subscription_plan,
          trial_phase,
          COUNT(*) as count
        FROM sites
        GROUP BY subscription_plan, trial_phase
      `);

      res.json({
        subscriptions: subscriptionStats.rows[0] || {},
        recentPayments: recentPayments.rows,
        monthlyRevenue: monthlyRevenue.rows,
        customers: customerStats.rows[0] || {},
        siteBreakdown: siteSubscriptions.rows
      });
    } catch (error: any) {
      console.error('Revenue data error:', error);
      res.status(500).json({ error: 'Failed to fetch revenue data' });
    }
  });
}
