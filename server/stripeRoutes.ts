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
      const key = getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get Stripe key' });
    }
  });

  // Get available subscription products and prices
  app.get('/api/stripe/products', async (req, res) => {
    try {
      const stripe = getUncachableStripeClient();

      // Fetch products directly from Stripe API
      const products = await stripe.products.list({
        active: true,
        limit: 20,
      });

      const localblueProducts = products.data.filter(
        (p) => p.metadata?.localblue_product === 'true'
      );

      // Fetch prices for each product
      const productsWithPrices = await Promise.all(
        localblueProducts.map(async (product) => {
          const prices = await stripe.prices.list({
            product: product.id,
            active: true,
          });
          return {
            id: product.id,
            name: product.name,
            description: product.description,
            metadata: product.metadata,
            prices: prices.data
              .map((price) => ({
                id: price.id,
                unit_amount: price.unit_amount,
                currency: price.currency,
                recurring: price.recurring,
                metadata: price.metadata,
              }))
              .sort((a, b) => (a.unit_amount || 0) - (b.unit_amount || 0)),
          };
        })
      );

      // Sort by tier metadata
      productsWithPrices.sort(
        (a, b) => Number(a.metadata?.tier || 0) - Number(b.metadata?.tier || 0)
      );

      res.json({ products: productsWithPrices });
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

      const stripe = getUncachableStripeClient();

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
      const mainDomain = process.env.MAIN_DOMAIN || 'localhost:5000';
      const baseUrl = `https://${mainDomain}`;
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

      const stripe = getUncachableStripeClient();
      const mainDomain = process.env.MAIN_DOMAIN || 'localhost:5000';
      const baseUrl = `https://${mainDomain}`;

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

      // Get subscription directly from Stripe
      const stripe = getUncachableStripeClient();
      const subscription = await stripe.subscriptions.retrieve(site.stripeSubscriptionId);

      res.json({
        subscription: subscription || null,
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
      const stripe = getUncachableStripeClient();

      // Get subscription metrics from Stripe directly
      const subscriptions = await stripe.subscriptions.list({ limit: 100 });
      const activeCount = subscriptions.data.filter(s => s.status === 'active').length;
      const trialingCount = subscriptions.data.filter(s => s.status === 'trialing').length;
      const pastDueCount = subscriptions.data.filter(s => s.status === 'past_due').length;
      const canceledCount = subscriptions.data.filter(s => s.status === 'canceled').length;

      // Calculate MRR from active subscriptions
      let mrr = 0;
      for (const sub of subscriptions.data) {
        if (sub.status === 'active' && sub.items.data[0]?.price) {
          const price = sub.items.data[0].price;
          const amount = (price.unit_amount || 0) / 100;
          if (price.recurring?.interval === 'month') {
            mrr += amount;
          } else if (price.recurring?.interval === 'year') {
            mrr += amount / 12;
          }
        }
      }

      // Get recent payments
      const payments = await stripe.paymentIntents.list({
        limit: 10,
      });
      const recentPayments = payments.data
        .filter(pi => pi.status === 'succeeded')
        .map(pi => ({
          id: pi.id,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
          created: pi.created,
        }));

      // Get customer count
      const customers = await stripe.customers.list({ limit: 1 });
      const totalCustomers = customers.data.length > 0
        ? (customers as any).total_count || customers.data.length
        : 0;

      // Get site subscription breakdown from local DB
      const siteSubscriptions = await db.execute(sql`
        SELECT
          subscription_plan,
          trial_phase,
          COUNT(*) as count
        FROM sites
        GROUP BY subscription_plan, trial_phase
      `);

      res.json({
        subscriptions: {
          active_subscriptions: activeCount,
          trialing_subscriptions: trialingCount,
          past_due_subscriptions: pastDueCount,
          canceled_subscriptions: canceledCount,
          monthly_recurring_revenue: mrr,
        },
        recentPayments,
        monthlyRevenue: [],
        customers: { total_customers: totalCustomers },
        siteBreakdown: siteSubscriptions.rows,
      });
    } catch (error: any) {
      console.error('Revenue data error:', error);
      res.status(500).json({ error: 'Failed to fetch revenue data' });
    }
  });
}
