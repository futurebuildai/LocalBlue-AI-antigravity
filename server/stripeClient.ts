import Stripe from 'stripe';

function getStripeKeys() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

  if (!secretKey || !publishableKey) {
    throw new Error('Stripe keys not configured. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY env vars.');
  }

  return { secretKey, publishableKey };
}

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const { secretKey } = getStripeKeys();
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover',
    });
  }
  return stripeClient;
}

export function getUncachableStripeClient(): Stripe {
  const { secretKey } = getStripeKeys();
  return new Stripe(secretKey, {
    apiVersion: '2025-11-17.clover',
  });
}

export function getStripePublishableKey(): string {
  const { publishableKey } = getStripeKeys();
  return publishableKey;
}

export function getStripeSecretKey(): string {
  const { secretKey } = getStripeKeys();
  return secretKey;
}
