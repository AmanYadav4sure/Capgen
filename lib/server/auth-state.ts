import 'server-only';
import { createHash } from 'node:crypto';
import { database } from './database';
import { ApiError } from './http';

/** Atomic limits across server instances. Clerk owns authentication attempts and revocation. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  const keyHash = createHash('sha256').update(key).digest('hex');
  const result = await database().query(
    `INSERT INTO request_limits(key_hash,count,expires_at) VALUES($1,1,now()+($3::double precision*interval '1 millisecond'))
    ON CONFLICT(key_hash) DO UPDATE SET count=CASE WHEN request_limits.expires_at<=now() THEN 1 ELSE request_limits.count+1 END,
      expires_at=CASE WHEN request_limits.expires_at<=now() THEN excluded.expires_at ELSE request_limits.expires_at END
    WHERE request_limits.expires_at<=now() OR request_limits.count<$2 RETURNING count`,
    [keyHash, limit, windowMs],
  );
  if (!result.rowCount)
    throw new ApiError(429, 'Too many requests. Please wait a few minutes and try again.');
}
