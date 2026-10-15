import 'server-only';
import { createHash } from 'node:crypto';
import { transaction } from './database';
import { ApiError } from './http';

export interface AccountUser {
  uid: string;
  email: string;
  name: string;
}
export interface VerifiedClerkIdentity {
  id: string;
  email: string;
  name: string;
  verified: boolean;
}
export function legacyAccountId(email: string): string {
  return 'em_' + createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 20);
}

/** Only a server-fetched, verified Clerk primary email may claim an imported account. */
export async function provisionIdentity(identity: VerifiedClerkIdentity): Promise<AccountUser> {
  const email = identity.email.trim().toLowerCase();
  if (
    !identity.verified ||
    !identity.id.startsWith('user_') ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254
  )
    throw new ApiError(403, 'Verify your primary email in Clerk before opening your account.');
  return transaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
      `clerk:${identity.id}`,
    ]);
    const existing = await client.query(
      'SELECT uid, email, name FROM app_users WHERE clerk_user_id = $1 FOR UPDATE',
      [identity.id],
    );
    if (existing.rows[0]) {
      const updated = await client.query(
        'UPDATE app_users SET email=$2, updated_at=now() WHERE uid=$1 RETURNING uid,email,name',
        [existing.rows[0].uid, email],
      );
      return updated.rows[0];
    }
    await client.query(
      'INSERT INTO app_users(uid,clerk_user_id,email,name) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',
      [legacyAccountId(email), identity.id, email, identity.name.trim().slice(0, 120)],
    );
    const account = (
      await client.query(
        'SELECT uid,email,name,clerk_user_id FROM app_users WHERE email=$1 FOR UPDATE',
        [email],
      )
    ).rows[0];
    if (!account || (account.clerk_user_id && account.clerk_user_id !== identity.id))
      throw new ApiError(
        409,
        'This email belongs to an existing account. Contact support to recover it.',
      );
    if (!account.clerk_user_id)
      await client.query('UPDATE app_users SET clerk_user_id=$2, updated_at=now() WHERE uid=$1', [
        account.uid,
        identity.id,
      ]);
    return { uid: account.uid, email: account.email, name: account.name };
  });
}
