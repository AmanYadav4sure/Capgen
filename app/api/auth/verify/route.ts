import { privateJson } from '@/lib/server/http';
export async function POST() {
  return privateJson(
    { error: 'This email-code endpoint has been retired. Sign in through Clerk at /sign-in.' },
    410,
  );
}
