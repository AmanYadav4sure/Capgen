import { NextResponse } from 'next/server';
import { addCreditsToUser } from '@/lib/firebase/db';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    const eventType = event.event_type || event.type;
    const data = event.data;

    if (!data) {
      return NextResponse.json({ error: 'Missing data in payload' }, { status: 400 });
    }

    const customData = data.custom_data || data.customData || {};
    const userId = customData.userId || customData.user_id;

    if (
      eventType === 'transaction.completed' ||
      eventType === 'subscription.created' ||
      eventType === 'subscription.updated'
    ) {
      if (userId) {
        // Determine credit quantity from items or price ID
        const items = data.items || [];
        const firstItemPriceId = items[0]?.price?.id || items[0]?.price_id || '';

        const proPriceId = process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID || '';
        const teamPriceId = process.env.NEXT_PUBLIC_PADDLE_TEAM_PRICE_ID || '';

        let creditsToAdd = 1500; // Default Pro plan credits
        if (firstItemPriceId === teamPriceId || firstItemPriceId.includes('team')) {
          creditsToAdd = 5000;
        }

        const newTotal = await addCreditsToUser(userId, creditsToAdd);
        console.log(`Successfully credited ${creditsToAdd} credits to user ${userId}. New balance: ${newTotal}`);
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (err: any) {
    console.error('Paddle Webhook error:', err);
    return NextResponse.json({ error: err?.message || 'Webhook handler failed' }, { status: 500 });
  }
}
