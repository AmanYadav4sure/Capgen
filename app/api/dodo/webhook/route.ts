import DodoPayments from 'dodopayments';
import { apiError, ApiError, privateJson, readBody } from '@/lib/server/http';
import { applyBillingEvent } from '@/lib/server/billing';

export async function POST(req: Request) {
  try {
    const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    if (!secret) throw new ApiError(503, 'Webhook verification is not configured.');
    const webhookId = req.headers.get('webhook-id');
    const timestamp = req.headers.get('webhook-timestamp');
    const signature = req.headers.get('webhook-signature');
    if (
      !webhookId ||
      webhookId.length > 200 ||
      !timestamp ||
      !signature ||
      signature.length > 4096 ||
      !/^\d+$/.test(timestamp) ||
      Math.abs(Date.now() / 1000 - Number(timestamp)) > 300
    )
      throw new ApiError(401, 'Invalid webhook signature.');
    const raw = await readBody(req, 1000000);
    let event;
    try {
      // The existing official SDK decodes whsec_ keys and verifies Standard Webhooks.
      const verifier = new DodoPayments({
        bearerToken: process.env.DODO_PAYMENTS_API_KEY || 'verification-only',
        webhookKey: secret,
      });
      event = verifier.webhooks.unwrap(raw, {
        headers: {
          'webhook-id': webhookId,
          'webhook-timestamp': timestamp,
          'webhook-signature': signature,
        },
      });
    } catch {
      throw new ApiError(401, 'Invalid webhook signature.');
    }
    const data = event.data as unknown as {
      metadata?: Record<string, unknown>;
      subscription_id?: string;
    };
    const metadata = data?.metadata || {};
    const userId = metadata.user_id || metadata.userId;
    const plan = metadata.plan === 'team' ? 'team' : 'pro';
    const type = event.type as string;
    if (
      [
        'payment.succeeded',
        'payment.succeed',
        'subscription.active',
        'subscription.renewed',
      ].includes(type)
    ) {
      // Missing attribution must retry / be reconciled, never report a silent successful grant.
      if (typeof userId !== 'string') throw new ApiError(422, 'Account attribution is missing.');
      const subscription = type.startsWith('subscription.') || !!data.subscription_id;
      await applyBillingEvent(
        webhookId,
        userId,
        subscription ? (plan === 'team' ? 5000 : 1500) : 300,
        subscription ? plan : undefined,
      );
    }
    return privateJson({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
