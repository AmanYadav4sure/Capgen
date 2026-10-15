import 'server-only';
import { Pool, type PoolClient } from 'pg';
import { ApiError } from './http';

const databaseGlobal = globalThis as typeof globalThis & { capgenPool?: Pool };
export function database(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString)
    throw new ApiError(503, 'Account storage is not connected. Please contact support.');
  if (!databaseGlobal.capgenPool) {
    const url = new URL(connectionString);
    if (url.hostname.endsWith('.neon.tech')) url.searchParams.set('sslmode', 'verify-full');
    const pool = new Pool({
      connectionString: url.toString(),
      max: 4,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 15000,
      allowExitOnIdle: true,
    });
    pool.on('error', () => console.error('[database] An idle connection failed.'));
    databaseGlobal.capgenPool = pool;
  }
  return databaseGlobal.capgenPool;
}
export async function transaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await database().connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '5s'");
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
