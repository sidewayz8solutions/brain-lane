/**
 * Brain Lane — Billing Service
 * =============================
 * Stripe integration for:
 * - Pay-per-use credits
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

  // Subscription tiers (Point #8)
  subscriptions: {
    free: {
      id: 'free',
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
        projects: 3, // Increased for better demo experience
        filesPerProject: 50,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        aiCallsPerDay: 15, // Increased limit
        hasFullAnalysis: false,
        hasAgentOrchestration: false,
      },
    },
    pro: {
      id: 'pro',
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
        hasFullAnalysis: true,
        hasAgentOrchestration: true,
      },
    },
    team: {
      id: 'team',
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
        hasFullAnalysis: true,
        hasAgentOrchestration: true,
      },
    },
    enterprise: {
      id: 'enterprise',
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
        hasFullAnalysis: true,
        hasAgentOrchestration: true,
      },
    },
  },

  // Credit costs per operation
  creditCosts: {
    zip_upload: 0,
    project_analysis: 50, // Increased cost for heavy AI work
    task_generation: 15,
    code_refactor: 25,
    file_generation: 30,
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
    this.defaultTier = 'free';
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
      // NOTE: Dynamic import removed for canvas compatibility, rely on external script or mock
      // const { loadStripe } = await import('@stripe/stripe-js');
      // this.stripe = await loadStripe(this.stripePublicKey);
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
  getTierLimits(tierId) {
    return PRICING.subscriptions[tierId]
      ? PRICING.subscriptions[tierId].limits
      : PRICING.subscriptions[this.defaultTier].limits;
  }

  /**
   * Simulate loading user tier and credits from backend (Point #8)
   */
  async fetchUserBillingStatus(userId) {
    if (userId === 'local-user') {
      // Demo mode status
      return {
        currentTier: PRICING.subscriptions.free.id,
        creditsBalance: 95, // Start user with some credits
        isSubscriptionActive: false,
        lastRefreshed: new Date().toISOString(),
      };
    }

    // In a real application, this fetches data from your database:
    // const response = await fetch(`/api/billing/status?userId=${userId}`);
    // return response.json();

    // For production-readiness demonstration, we mock the Pro tier after login
    return {
      currentTier: PRICING.subscriptions.pro.id,
      creditsBalance: 950,
      isSubscriptionActive: true,
      lastRefreshed: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // CHECKOUT & CREDIT MANAGEMENT (STUBS for Production)
  // ---------------------------------------------------------------------------

  /**
   * Check if user has enough credits
   */
  async checkFeatureAccess(feature, userProfile) {
    const limits = this.getTierLimits(userProfile?.tier);

    // 1. Check feature flag (e.g., orchestration is pro-only)
    if (feature === 'full_analysis' && !limits.hasFullAnalysis) return { allowed: false, reason: 'Feature requires Pro or higher plan.' };
    if (feature === 'agent_orchestration' && !limits.hasAgentOrchestration) return { allowed: false, reason: 'Feature requires Pro or higher plan.' };

    // 2. Check credit balance if applicable
    const cost = this.getCreditCost(feature);
    if (cost > 0 && (userProfile?.creditsBalance || 0) < cost) {
      return { allowed: false, reason: `Insufficient credits. Cost: ${cost}` };
    }

    // 3. Check hard limits (e.g., project count)
    // Example: if (feature === 'create_project' && limits.projects !== -1 && userProjectCount >= limits.projects) return { allowed: false, reason: 'Project limit reached.' };

    return { allowed: true };
  }

  /**
   * Consume credits for an operation (called after operation completes)
   */
  async consumeCredits(operation, userId) {
    const cost = this.getCreditCost(operation);
    if (cost === 0) return true;

    // In production, this would make an API call to decrement the user's credit balance:
    // const response = await fetch('/api/billing/consume-credits', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ userId, operation, credits: cost }),
    // });
    // return response.ok;

    console.log(`💸 Simulating credit consumption: ${cost} for ${operation} by user ${userId}`);
    return true;
  }

  // Stubs for Stripe interaction (as in the original file)
  async buyCredits(packId) { /* ... stub ... */ console.log(`Simulating buying credits: ${packId}`); }
  async buySprint(sprintId) { /* ... stub ... */ console.log(`Simulating buying sprint: ${sprintId}`); }
  async subscribe(tier, yearly = false) { /* ... stub ... */ console.log(`Simulating subscription: ${tier}`); }
  async openPortal() { /* ... stub ... */ console.log('Simulating opening portal'); }
}

// ============================================================================
// USAGE METERING SERVICE
// ============================================================================

export class UsageMeter {
  // ... (rest of UsageMeter class remains the same)
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
