import { initializePaddle, Paddle } from '@paddle/paddle-js';

let paddleInstance: Paddle | null = null;

export async function getPaddleInstance() {
  if (paddleInstance) return paddleInstance;
  paddleInstance = (await initializePaddle({
    environment: (process.env.NEXT_PUBLIC_PADDLE_ENV as 'sandbox' | 'production') || 'sandbox',
    token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '',
  })) ?? null;
  return paddleInstance;
}

export async function startPaddleCheckout({
  priceId,
  userId,
  userEmail,
}: {
  priceId: string;
  userId: string;
  userEmail?: string | null;
}) {
  const paddle = await getPaddleInstance();
  if (!paddle) {
    console.error('Paddle failed to initialize');
    return;
  }

  paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: userEmail ? { email: userEmail } : undefined,
    customData: {
      userId: userId, // Identifies the user in our webhook
    },
    settings: {
      displayMode: 'overlay',
      theme: 'light',
      successUrl: `${window.location.origin}/profile?payment=success`,
    },
  });
}
