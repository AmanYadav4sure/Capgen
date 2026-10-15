import { cookies } from 'next/headers';
import { accountSession } from '@/lib/server/session';
import { ApiError, apiError, privateJson, sameOrigin } from '@/lib/server/http';

export async function GET() {
  try {
    return privateJson({ user: await accountSession(true) });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return privateJson({ user: null });
    return apiError(error);
  }
}
export async function DELETE(req: Request) {
  try {
    sameOrigin(req);
    const jar = await cookies();
    jar.delete('capgen_session');
    jar.delete('capgen_code_token');
    return privateJson({ error: 'Sign out through Clerk to end your current session.' }, 410);
  } catch (error) {
    return apiError(error);
  }
}
