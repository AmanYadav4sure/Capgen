import { NextResponse } from 'next/server';
import { dodoClient, resolvePlan, dodoConfigured } from '@/lib/dodo';
import { apiError, jsonBody, sameOrigin, requireUser } from '@/lib/server/http';
import { SITE_URL } from '@/lib/seo';

/**
 * POST /api/dodo/checkout
 * Creates a Dodo checkout session for a plan and returns the payment link.
 * Body: { planId: 'pro' | 'team' } (product id from env)
 */
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    if (!dodoConfigured()) {
      return NextResponse.json(
        { error: 'Payments are not configured yet. Please try again later.' },
        { status: 503 },
      );
    }

    // Require an authenticated session so the webhook can credit the right user
    const session = await requireUser(req);

    const { planId } = await jsonBody(req);
    const plan = resolvePlan(String(planId || ''));
    if (!plan) {
      return NextResponse.json(
        { error: 'This plan is unavailable. Please choose a listed plan.' },
        { status: 400 },
      );
    }

    const origin = SITE_URL;

    const sessionResponse = await dodoClient().checkoutSessions.create({
      product_cart: [{ product_id: plan.productId, quantity: 1 }],
      return_url: `${origin}/profile?payment=success`,
      cancel_url: `${origin}/pricing?payment=cancelled`,
      // webhook handler reads metadata.user_id to credit the account
      metadata: {
        user_id: session.uid,
        user_email: session.email,
        plan: plan.plan,
      },
      customer: session.email
        ? { email: session.email, name: session.name || undefined }
        : undefined,
    });

    return NextResponse.json({ ok: true, checkoutUrl: sessionResponse.checkout_url });
  } catch (err: unknown) {
    return apiError(err);
  }
}
