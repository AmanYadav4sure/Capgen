import 'server-only';
import { createHash } from 'node:crypto';
import { transaction } from './database';
import { ApiError } from './http';

/** Keep existing grant amounts/classification and deduplicate every signed delivery. */
export async function applyBillingEvent(
  eventId: string,
  uid: string,
  credits: number,
  plan?: 'pro' | 'team',
): Promise<void> {
  if (
    !/^[A-Za-z0-9_-]{1,128}$/.test(uid) ||
    !eventId ||
    eventId.length > 200 ||
    !Number.isSafeInteger(credits) ||
    credits < 1
  )
    throw new ApiError(400, 'Invalid billing metadata.');
  await transaction(async (client) => {
    const user = (
      await client.query('SELECT credits FROM app_users WHERE uid=$1 FOR UPDATE', [uid])
    ).rows[0];
    if (!user)
      throw new ApiError(
        409,
        'The billing account must be restored before this payment can be applied.',
      );
    const deliveryHash = createHash('sha256').update(eventId).digest('hex');
    const ledger = await client.query(
      'INSERT INTO billing_events(event_id,user_id,credits,plan) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING event_id',
      [deliveryHash, uid, credits, plan || null],
    );
    if (!ledger.rowCount) return;
    await client.query(
      'UPDATE app_users SET credits=credits+$2,plan=COALESCE($3,plan),is_pro=CASE WHEN $3::text IS NULL THEN is_pro ELSE true END,updated_at=now() WHERE uid=$1',
      [uid, credits, plan || null],
    );
  });
}
