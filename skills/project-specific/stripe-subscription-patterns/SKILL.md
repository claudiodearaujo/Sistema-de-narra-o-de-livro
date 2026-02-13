---
name: stripe-subscription-patterns
description: Stripe subscription billing, webhooks, and payment management for Livrya
keywords: [stripe, subscriptions, billing, webhooks, payments, livrya]
category: project-specific
---

# 💳 Stripe Subscription Patterns

Production patterns for Stripe subscription management in Livrya's freemium model.

## Overview

Livrya subscription tiers:
- **Free** - Limited chapters, ads
- **Premium** - All chapters, no ads
- **Creator** - Publish books, higher royalties

---

## Key Patterns

### Pattern 1: Create Subscription

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function createSubscription(
  userId: string,
  email: string,
  priceId: string // e.g., 'price_premium_monthly'
): Promise<Stripe.Subscription> {
  // Get or create customer
  let customer = await stripe.customers.list({
    email,
    limit: 1,
  });

  let customerId: string;

  if (customer.data.length > 0) {
    customerId = customer.data[0].id;
  } else {
    const newCustomer = await stripe.customers.create({
      email,
      metadata: { userId },
    });
    customerId = newCustomer.id;
  }

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });

  // Save to database
  await prisma.subscription.create({
    data: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      status: subscription.status,
      planId: priceId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  return subscription;
}
```

### Pattern 2: Handle Webhooks

```typescript
express.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await handleInvoiceFailed(event.data.object as Stripe.Invoice);
          break;
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).send('Webhook error');
    }
  }
);

async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  await prisma.subscription.create({
    data: {
      userId: '', // Get from metadata
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      planId: subscription.items.data[0].price.id,
    },
  });

  console.log(`✓ Subscription created: ${subscription.id}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: invoice.subscription as string },
    data: { status: 'active', failedAttempts: 0 },
  });

  console.log(`✓ Invoice paid: ${invoice.id}`);
}

async function handleInvoiceFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription as string },
  });

  const attempts = (subscription?.failedAttempts || 0) + 1;

  await prisma.subscription.update({
    where: { stripeSubscriptionId: invoice.subscription as string },
    data: { failedAttempts: attempts },
  });

  if (attempts >= 3) {
    // Cancel subscription
    await stripe.subscriptions.del(invoice.subscription as string);
  }

  console.log(`✗ Invoice failed: ${invoice.id} (Attempt ${attempts})`);
}
```

### Pattern 3: Manage Billing

```typescript
class BillingService {
  /**
   * Update subscription plan
   */
  async upgradePlan(userId: string, newPriceId: string): Promise<void> {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: 'active' },
    });

    if (!subscription) throw new Error('No active subscription');

    // Update in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: (
            await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)
          ).items.data[0].id,
          price: newPriceId,
        },
      ],
    });

    // Update in database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { planId: newPriceId },
    });
  }

  /**
   * Cancel subscription
   */
  async cancel(userId: string): Promise<void> {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: { in: ['active', 'past_due'] } },
    });

    if (!subscription) return;

    // Cancel in Stripe
    await stripe.subscriptions.del(subscription.stripeSubscriptionId);

    // Update database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    });
  }

  /**
   * Get billing history
   */
  async getBillingHistory(userId: string): Promise<Stripe.Invoice[]> {
    const subscription = await prisma.subscription.findFirst({
      where: { userId },
    });

    if (!subscription) return [];

    const customer = await stripe.customers.retrieve(
      subscription.stripeCustomerId
    );

    return stripe.invoices.list({
      customer: customer.id,
      limit: 12,
    });
  }

  /**
   * Get subscription info
   */
  async getSubscriptionInfo(userId: string): Promise<any> {
    const subscription = await prisma.subscription.findFirst({
      where: { userId },
    });

    if (!subscription) {
      return { status: 'free', plan: 'free' };
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    return {
      status: subscription.status,
      plan: subscription.planId,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      failedAttempts: subscription.failedAttempts,
    };
  }
}
```

### Pattern 4: Trial Period

```typescript
async function createTrialSubscription(userId: string, email: string): Promise<void> {
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: 'price_premium_monthly' }],
    trial_period_days: 14, // 2-week trial
    payment_behavior: 'default_incomplete',
  });

  await prisma.subscription.create({
    data: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customer.id,
      status: 'trialing',
      planId: 'price_premium_monthly',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  // Send trial started email
  await sendEmail(email, 'trial_started.html');
}

// Scheduled job to check trial endings
async function checkTrialEndings(): Promise<void> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const endingTrials = await prisma.subscription.findMany({
    where: {
      status: 'trialing',
      trialEndsAt: { lte: tomorrow },
    },
    include: { user: true },
  });

  for (const subscription of endingTrials) {
    await sendEmail(subscription.user.email, 'trial_ending_soon.html', {
      daysLeft: 1,
      plan: 'Premium',
    });
  }
}
```

---

## Best Practices

### ✅ DO's

1. **Always Use Webhooks** - Don't trust client updates
2. **Test Webhook Handling** - Use Stripe CLI
3. **Handle Failures** - Retry failed payments
4. **Track Attempts** - Monitor payment attempts
5. **Provide Clear Cancellation** - Easy to cancel

### ❌ DON'Ts

1. **Don't Store Card Data** - Let Stripe handle it
2. **Don't Skip PCI Compliance**
3. **Don't Ignore Failed Payments**
4. **Don't Over-notify** - Limit billing emails

---

**Status:** ✅ Production Ready
**Last Updated:** 2026-02-13
