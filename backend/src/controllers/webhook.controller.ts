/**
 * Stripe Webhook Controller
 * Handles Stripe webhook events
 * Sprint 9: Planos e Pagamentos
 */

import { Request, Response } from 'express';
import { stripeService } from '../services/stripe.service';
import { subscriptionService } from '../services/subscription.service';

/**
 * POST /webhooks/stripe
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'] as string;
  
  if (!signature) {
    console.warn('Missing Stripe signature');
    return res.status(400).json({ error: 'Missing signature' });
  }

  // Get raw body (needs express.raw() middleware)
  const rawBody = req.body;
  
  if (!rawBody) {
    console.warn('Missing request body');
    return res.status(400).json({ error: 'Missing body' });
  }

  const event = stripeService.verifyWebhookSignature(rawBody, signature);
  
  if (!event) {
    console.warn('Invalid Stripe signature');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  console.log(`Received Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(session: any) {
  console.log('Processing checkout.session.completed:', session.id);

  const metadata = session.metadata || {};
  const userId = metadata.userId;

  if (!userId) {
    console.warn('No userId in checkout session metadata');
    return;
  }

  // Check if this is a Livra package purchase
  if (metadata.type === 'livra_purchase') {
    const livraAmount = parseInt(metadata.livraAmount, 10);
    if (livraAmount > 0) {
      await subscriptionService.handleLivraPurchase(userId, livraAmount);
      console.log(`Livra purchase completed: ${livraAmount} Livras for user ${userId}`);
    }
    return;
  }

  // Handle subscription checkout
  const subscriptionId = session.subscription;
  if (!subscriptionId) {
    console.warn('No subscription in checkout session');
    return;
  }

  // Get the price ID from the subscription
  const stripeSubscription = await stripeService.getStripeSubscription(subscriptionId);
  if (!stripeSubscription) {
    console.warn('Could not fetch subscription details');
    return;
  }

  const priceId = stripeSubscription.items.data[0]?.price.id;
  if (!priceId) {
    console.warn('No price ID in subscription');
    return;
  }

  await subscriptionService.handleCheckoutCompleted(userId, subscriptionId, priceId);
  console.log(`Subscription activated for user ${userId}: ${subscriptionId}`);
}

/**
 * Handle invoice.paid event (renewal)
 */
async function handleInvoicePaid(invoice: any) {
  console.log('Processing invoice.paid:', invoice.id);

  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;

  if (!subscriptionId) {
    console.log('Invoice is not for a subscription');
    return;
  }

  // Check if this is the first invoice (handled by checkout.session.completed)
  if (invoice.billing_reason === 'subscription_create') {
    console.log('Skipping first invoice (handled by checkout)');
    return;
  }

  await subscriptionService.handleInvoicePaid(subscriptionId, customerId);
  console.log(`Invoice paid for subscription ${subscriptionId}`);
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: any) {
  console.log('Processing invoice.payment_failed:', invoice.id);
  
  // Log the failed payment
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;
  
  console.warn(`Payment failed for subscription ${subscriptionId}, customer ${customerId}`);
  
  // The subscription status will be updated by customer.subscription.updated
  // We could send a notification to the user here
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: any) {
  console.log('Processing customer.subscription.updated:', subscription.id);

  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    console.warn('No price ID in subscription update');
    return;
  }

  await subscriptionService.handleSubscriptionUpdated(
    subscription.id,
    subscription.status,
    priceId,
    subscription.current_period_start,
    subscription.current_period_end,
    subscription.cancel_at_period_end
  );

  console.log(`Subscription updated: ${subscription.id} - status: ${subscription.status}`);
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: any) {
  console.log('Processing customer.subscription.deleted:', subscription.id);

  await subscriptionService.handleSubscriptionCancelled(subscription.id);

  console.log(`Subscription cancelled: ${subscription.id}`);
}
