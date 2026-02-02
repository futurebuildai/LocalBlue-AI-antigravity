/**
 * Seed script to create LocalBlue pricing plans in Stripe
 * Run with: npx tsx server/seed-stripe-products.ts
 */
import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();
  
  console.log('Creating LocalBlue subscription products in Stripe...');

  // Check if products already exist
  const existingProducts = await stripe.products.search({ 
    query: "metadata['localblue_product']:'true'" 
  });
  
  if (existingProducts.data.length > 0) {
    console.log('Products already exist, skipping creation...');
    for (const product of existingProducts.data) {
      console.log(`  - ${product.name} (${product.id})`);
    }
    return;
  }

  // Create Starter Plan
  const starterProduct = await stripe.products.create({
    name: 'LocalBlue Starter',
    description: 'Professional Presence - AI-built website with contact forms, appointment requests, project gallery, and testimonials.',
    metadata: {
      localblue_product: 'true',
      plan: 'starter',
      tier: '1',
    }
  });
  
  const starterMonthly = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 4900, // $49.00
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { plan: 'starter', billing_period: 'monthly' }
  });
  
  const starterAnnual = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 49000, // $490.00 (2 months free)
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { plan: 'starter', billing_period: 'annual' }
  });
  
  console.log(`Created Starter: ${starterProduct.id}`);
  console.log(`  - Monthly: ${starterMonthly.id} ($49/mo)`);
  console.log(`  - Annual: ${starterAnnual.id} ($490/yr)`);

  // Create Growth Plan
  const growthProduct = await stripe.products.create({
    name: 'LocalBlue Growth',
    description: 'Lead Automation - Everything in Starter plus AI Sales Chatbot that captures leads 24/7 and before/after project galleries.',
    metadata: {
      localblue_product: 'true',
      plan: 'growth',
      tier: '2',
    }
  });
  
  const growthMonthly = await stripe.prices.create({
    product: growthProduct.id,
    unit_amount: 9900, // $99.00
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { plan: 'growth', billing_period: 'monthly' }
  });
  
  const growthAnnual = await stripe.prices.create({
    product: growthProduct.id,
    unit_amount: 99000, // $990.00 (2 months free)
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { plan: 'growth', billing_period: 'annual' }
  });
  
  console.log(`Created Growth: ${growthProduct.id}`);
  console.log(`  - Monthly: ${growthMonthly.id} ($99/mo)`);
  console.log(`  - Annual: ${growthAnnual.id} ($990/yr)`);

  // Create Scale Plan
  const scaleProduct = await stripe.products.create({
    name: 'LocalBlue Scale',
    description: 'Local Dominance - Everything in Growth plus instant quote calculator and service pricing display.',
    metadata: {
      localblue_product: 'true',
      plan: 'scale',
      tier: '3',
    }
  });
  
  const scaleMonthly = await stripe.prices.create({
    product: scaleProduct.id,
    unit_amount: 19900, // $199.00
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { plan: 'scale', billing_period: 'monthly' }
  });
  
  const scaleAnnual = await stripe.prices.create({
    product: scaleProduct.id,
    unit_amount: 199000, // $1,990.00 (2 months free)
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { plan: 'scale', billing_period: 'annual' }
  });
  
  console.log(`Created Scale: ${scaleProduct.id}`);
  console.log(`  - Monthly: ${scaleMonthly.id} ($199/mo)`);
  console.log(`  - Annual: ${scaleAnnual.id} ($1,990/yr)`);

  console.log('\nAll products created successfully!');
}

createProducts().catch(console.error);
