/**
 * Brain Lane — Billing Service
 * =============================
 * Stripe integration for:
 * - Pay-per-use credits
 * - $9 one-week sprint pass
 * - Subscription tiers (Pro, Team, Enterprise)
 */

// ============================================================================
// PRICING CONFIGURATION
// ============================================================================

export const PRICING = {
  // Credit packs (pay-per-use)
  credits: {
    starter: { credits: 50, price: 5, priceId: 'price_credits_50' },
    standard: { credits: 200, price: 15, priceId: 'price_credits_200' },
    pro: { credits: 500, price: 30, priceId: 'price_credits_500' },
    enterprise: { credits: 2000, price: 100, priceId: 'price_credits_2000' },
  },

  // Sprint passes (time-limited)
  sprints: {
    week: {
      name: 'Weekly Sprint',
      price: 9,
      duration: 7, // days
      credits: 500,
      priceId: 'price_sprint_week',
    },
    month: {
      name: 'Monthly Sprint',
      price: 29,
      duration: 30,
      credits: 2500,
      priceId: 'price_sprint_month',
    },
  },

  // Subscription tiers
  subscriptions: {
    free: {
      name: 'Free',
      price: 0,
      credits: 100, // one-time
      features: [
        '100 credits (one-time)',
        '1 project',
        'Basic analysis',
        'Community support',
      ],
      limits: {
        projects: 1,
        filesPerProject: 50,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        aiCallsPerDay: 10,
      },
    },
    pro: {
      name: 'Pro',
      price: 29,
      priceId: 'price_pro_monthly',
      yearlyPrice: 290,
      yearlyPriceId: 'price_pro_yearly',
      credits: 1000, // monthly
      features: [
        '1,000 credits/month',
        'Unlimited projects',
        'Advanced analysis',
        'AI completion engine',
        'Priority support',
        'API access',
      ],
      limits: {
        projects: -1, // unlimited
        filesPerProject: 500,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        aiCallsPerDay: 100,
      },
    },
    team: {
      name: 'Team',
      price: 79,
      priceId: 'price_team_monthly',
      yearlyPrice: 790,
      yearlyPriceId: 'price_team_yearly',
      credits: 5000, // monthly
      features: [
        '5,000 credits/month',
        'Unlimited projects',
        'Team collaboration',
        'Advanced analytics',
        'Custom integrations',
        'Dedicated support',
      ],
      limits: {
        projects: -1,
        filesPerProject: 2000,
        maxFileSize: 100 * 1024 * 1024,
        aiCallsPerDay: 500,
        teamMembers: 10,
      },
    },
    enterprise: {
      name: 'Enterprise',
      price: null, // Contact sales
      credits: null, // Custom
      features: [
        'Unlimited credits',
        'Unlimited everything',
        'SSO/SAML',
        'Custom models',
        'On-premise option',
        'SLA guarantee',
        'Dedicated success manager',
      ],
      limits: {
        projects: -1,
        filesPerProject: -1,
        maxFileSize: -1,
        aiCallsPerDay: -1,
        teamMembers: -1,
      },
    },
  },

  // Credit costs per operation
  creditCosts: {
    zip_upload: 0,
    project_analysis: 10,
    task_generation: 5,
    code_refactor: 15,
    file_generation: 20,
    deployment_prep: 10,
    ai_chat: 1,
  },
};

// ============================================================================
// BILLING SERVICE
// ============================================================================

class BillingService {
  constructor() {
    this.stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    this.stripe = null;
  }

  /**
   * Initialize Stripe.js
   */
  async init() {
    if (!this.stripePublicKey) {
      console.warn('⚠️ Stripe not configured. Billing features disabled.');
      return false;
    }

    if (typeof window !== 'undefined' && !this.stripe) {
      // Load Stripe.js dynamically
      const { loadStripe } = await import('@stripe/stripe-js');
      this.stripe = await loadStripe(this.stripePublicKey);
    }

    return !!this.stripe;
  }

  /**
   * Check if billing is available
   */
  isAvailable() {
    return !!this.stripePublicKey;
  }

  /**
   * Get pricing info
   */
  getPricing() {
    return PRICING;
  }

  /**
   * Get credit cost for an operation
   */
  getCreditCost(operation) {
    return PRICING.creditCosts[operation] || 0;
  }

  /**
   * Get tier limits
   */
  getTierLimits(tier) {
    return PRICING.subscriptions[tier]?.limits || PRICING.subscriptions.free.limits;
  }

  // ---------------------------------------------------------------------------
  // CHECKOUT
  // ---------------------------------------------------------------------------

  /**
   * Create checkout session for credits
   */
  async buyCredits(packId) {
    const pack = PRICING.credits[packId];
    if (!pack) throw new Error('Invalid credit pack');

    return this._createCheckoutSession({
      mode: 'payment',
      priceId: pack.priceId,
      successUrl: `${window.location.origin}/billing/success?type=credits&pack=${packId}`,
      cancelUrl: `${window.location.origin}/billing`,
      metadata: {
        type: 'credits',
        credits: pack.credits,
      },
    });
  }

  /**
   * Create checkout session for sprint pass
   */
  async buySprint(sprintId) {
    const sprint = PRICING.sprints[sprintId];
    if (!sprint) throw new Error('Invalid sprint');

    return this._createCheckoutSession({
      mode: 'payment',
      priceId: sprint.priceId,
      successUrl: `${window.location.origin}/billing/success?type=sprint&sprint=${sprintId}`,
      cancelUrl: `${window.location.origin}/billing`,
      metadata: {
        type: 'sprint',
        duration: sprint.duration,
        credits: sprint.credits,
      },
    });
  }

  /**
   * Create checkout session for subscription
   */
  async subscribe(tier, yearly = false) {
    const plan = PRICING.subscriptions[tier];
    if (!plan || !plan.priceId) throw new Error('Invalid subscription tier');

    const priceId = yearly ? plan.yearlyPriceId : plan.priceId;

    return this._createCheckoutSession({
      mode: 'subscription',
      priceId,
      successUrl: `${window.location.origin}/billing/success?type=subscription&tier=${tier}`,
      cancelUrl: `${window.location.origin}/billing`,
      metadata: {
        type: 'subscription',
        tier,
        yearly,
      },
    });
  }

  /**
   * Redirect to Stripe Customer Portal
   */
  async openPortal() {
    const response = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    const { url } = await response.json();
    window.location.href = url;
  }

  /**
   * Create checkout session (internal)
   */
  async _createCheckoutSession({ mode, priceId, successUrl, cancelUrl, metadata }) {
    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        priceId,
        successUrl,
        cancelUrl,
        metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const { sessionId } = await response.json();

    // Redirect to Stripe Checkout
    if (this.stripe) {
      const { error } = await this.stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    }

    return sessionId;
  }

  // ---------------------------------------------------------------------------
  // CREDIT MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Check if user has enough credits
   */
  async hasCredits(operation, userProfile) {
    const cost = this.getCreditCost(operation);
    return (userProfile?.credits_balance || 0) >= cost;
  }

  /**
   * Consume credits for an operation (called after operation completes)
   */
  async consumeCredits(operation, userId) {
    const cost = this.getCreditCost(operation);
    if (cost === 0) return true;

    const response = await fetch('/api/billing/consume-credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, operation, credits: cost }),
    });

    return response.ok;
  }
}

// ============================================================================
// USAGE METERING SERVICE
// ============================================================================

export class UsageMeter {
  constructor() {
    this.metrics = {
      zipCount: 0,
      taskCount: 0,
      totalProjectSize: 0,
      computeMinutes: 0,
      aiCalls: 0,
      tokensUsed: 0,
    };
    this._loadFromStorage();
  }

  /**
   * Track a metric
   */
  track(metric, value = 1) {
    if (this.metrics.hasOwnProperty(metric)) {
      this.metrics[metric] += value;
      this._saveToStorage();
      this._notifyListeners(metric, this.metrics[metric]);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Reset metrics (for new billing period)
   */
  reset() {
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = 0;
    });
    this._saveToStorage();
  }

  /**
   * Start compute timer
   */
  startCompute() {
    return {
      startTime: Date.now(),
      stop: () => {
        const elapsed = (Date.now() - Date.now()) / 60000; // minutes
        this.track('computeMinutes', elapsed);
        return elapsed;
      },
    };
  }

  // Persistence
  _loadFromStorage() {
    try {
      const stored = localStorage.getItem('brain-lane-usage');
      if (stored) {
        const data = JSON.parse(stored);
        this.metrics = { ...this.metrics, ...data.metrics };
      }
    } catch (e) {
      console.warn('Failed to load usage metrics');
    }
  }

  _saveToStorage() {
    try {
      localStorage.setItem('brain-lane-usage', JSON.stringify({
        metrics: this.metrics,
        lastUpdated: new Date().toISOString(),
      }));
    } catch (e) {
      console.warn('Failed to save usage metrics');
    }
  }

  _listeners = new Set();
  
  subscribe(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  _notifyListeners(metric, value) {
    this._listeners.forEach(cb => cb(metric, value));
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const billingService = new BillingService();
export const usageMeter = new UsageMeter();
export default billingService;
