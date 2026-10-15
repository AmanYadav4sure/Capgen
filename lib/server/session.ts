import 'server-only';
import { auth, currentUser } from '@clerk/nextjs/server';
import { database } from './database';
import { ApiError } from './http';
import { provisionIdentity, type AccountUser } from './identity';

export async function accountSession(refreshIdentity = false): Promise<AccountUser> {
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
    throw new ApiError(503, 'Sign-in is not configured. Please contact support.');
  const session = await auth();
  if (!session.isAuthenticated || !session.userId)
    throw new ApiError(401, 'Your session has expired. Sign in to continue.');
  if (!refreshIdentity) {
    const account = (
      await database().query('SELECT uid,email,name FROM app_users WHERE clerk_user_id=$1', [
        session.userId,
      ])
    ).rows[0];
    if (account) return account;
  }
  const user = await currentUser();
  if (!user || user.id !== session.userId)
    throw new ApiError(401, 'Sign in again to open your account.');
  const primary = user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId);
  return provisionIdentity({
    id: user.id,
    email: primary?.emailAddress || '',
    verified: primary?.verification?.status === 'verified',
    name: user.fullName || user.username || '',
  });
}
