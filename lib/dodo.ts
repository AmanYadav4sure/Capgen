import DodoPayments from 'dodopayments';

/**
 * Dodo Payments server client.
 *
 * - API key from dashboard: Developer → API Keys
 * - test_mode vs live_mode follows DODO_PAYMENTS_MODE (default: test_mode)
 *
 * Products expected in the Dodo dashboard:
 *   DODO_PRODUCT_PRO_ID  → Creator Pro  ($14/mo, 1500 credits)
 *   DODO_PRODUCT_TEAM_ID → Agency Team  ($39/mo, 5000 credits)
 */

let client: DodoPayments | null = null;

export function dodoClient(): DodoPayments {
  if (!client) {
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) {
      throw new Error('Payment service is not configured (DODO_PAYMENTS_API_KEY missing).');
    }
    client = new DodoPayments({
      bearerToken: apiKey,
      environment:
        process.env.DODO_PAYMENTS_MODE === 'live' || process.env.DODO_PAYMENTS_MODE === 'live_mode'
          ? 'live_mode'
          : 'test_mode',
    });
  }
  return client;
}

export interface DodoPlan {
  productId: string;
  credits: number;
  plan: 'pro' | 'team';
  label: string;
}

export function resolvePlan(planId: string): DodoPlan | null {
  const proId = process.env.DODO_PRODUCT_PRO_ID || '';
  const teamId = process.env.DODO_PRODUCT_TEAM_ID || '';

  if (proId && (planId === 'pro' || planId === proId)) {
    return { productId: proId, credits: 1500, plan: 'pro', label: 'Creator Pro' };
  }
  if (teamId && (planId === 'team' || planId === teamId)) {
    return { productId: teamId, credits: 5000, plan: 'team', label: 'Agency Team' };
  }
  return null;
}

export function dodoConfigured(): boolean {
  return Boolean(process.env.DODO_PAYMENTS_API_KEY);
}
