// Stripe Webhook Handler for Vercel Edge Functions
// This endpoint handles Stripe webhook events for billing integration

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
    api: {
        bodyParser: false,
    },
};

async function buffer(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                await handleCheckoutCompleted(session);
                break;
            }

            case 'customer.subscription.created': {
                const subscription = event.data.object;
                await handleSubscriptionCreated(subscription);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                await handleSubscriptionUpdated(subscription);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await handleSubscriptionDeleted(subscription);
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                await handleInvoicePaymentSucceeded(invoice);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                await handleInvoicePaymentFailed(invoice);
                break;
            }

            case 'customer.created': {
                const customer = event.data.object;
                await handleCustomerCreated(customer);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Error handling webhook event:', err);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
}

// Handler functions
async function handleCheckoutCompleted(session) {
    console.log('Checkout completed:', session.id);
    
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    const userId = session.metadata?.userId;

    if (userId) {
        // Update user's subscription status in database
        // This would connect to your Supabase or database
        console.log(`User ${userId} completed checkout for subscription ${subscriptionId}`);
    }
}

async function handleSubscriptionCreated(subscription) {
    console.log('Subscription created:', subscription.id);
    
    const customerId = subscription.customer;
    const planId = subscription.items.data[0]?.price?.id;
    const status = subscription.status;

    // Store subscription details
    console.log(`Customer ${customerId} subscribed to plan ${planId} with status ${status}`);
}

async function handleSubscriptionUpdated(subscription) {
    console.log('Subscription updated:', subscription.id);
    
    const customerId = subscription.customer;
    const status = subscription.status;
    const cancelAtPeriodEnd = subscription.cancel_at_period_end;

    // Update subscription status in database
    console.log(`Subscription ${subscription.id} updated: status=${status}, cancelAtPeriodEnd=${cancelAtPeriodEnd}`);
}

async function handleSubscriptionDeleted(subscription) {
    console.log('Subscription deleted:', subscription.id);
    
    const customerId = subscription.customer;
    
    // Mark subscription as cancelled in database
    // Downgrade user to free tier
    console.log(`Customer ${customerId} subscription cancelled`);
}

async function handleInvoicePaymentSucceeded(invoice) {
    console.log('Invoice payment succeeded:', invoice.id);
    
    const customerId = invoice.customer;
    const amountPaid = invoice.amount_paid;
    const subscriptionId = invoice.subscription;

    // Record payment and reset usage limits
    console.log(`Customer ${customerId} paid ${amountPaid / 100} for subscription ${subscriptionId}`);
}

async function handleInvoicePaymentFailed(invoice) {
    console.log('Invoice payment failed:', invoice.id);
    
    const customerId = invoice.customer;
    const attemptCount = invoice.attempt_count;

    // Send notification to user about failed payment
    // Consider pausing service after multiple failures
    console.log(`Payment failed for customer ${customerId}, attempt ${attemptCount}`);
}

async function handleCustomerCreated(customer) {
    console.log('Customer created:', customer.id);
    
    const email = customer.email;
    const userId = customer.metadata?.userId;

    // Link Stripe customer to user in database
    console.log(`New Stripe customer ${customer.id} created for ${email}`);
}
