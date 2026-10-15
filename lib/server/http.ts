import { NextResponse } from 'next/server';
import type { AccountUser } from './identity';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function requireUser(_req: Request): Promise<AccountUser> {
  const { accountSession } = await import('./session');
  return accountSession();
}
export function sameOrigin(req: Request): void {
  const origin = req.headers.get('origin');
  if (
    req.headers.get('sec-fetch-site') === 'cross-site' ||
    (origin && origin !== new URL(req.url).origin)
  ) {
    throw new ApiError(403, 'This request must come from the Capgen website.');
  }
}
export async function readBody(req: Request, maxBytes: number): Promise<string> {
  if (Number(req.headers.get('content-length')) > maxBytes)
    throw new ApiError(413, 'The request is too large.');
  const reader = req.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new ApiError(413, 'The request is too large.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString('utf8');
}
export async function jsonBody(req: Request, maxBytes = 16384): Promise<Record<string, unknown>> {
  if (!req.headers.get('content-type')?.includes('application/json'))
    throw new ApiError(415, 'Send a JSON request.');
  const text = await readBody(req, maxBytes);
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ApiError(400, 'The request contains invalid JSON.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ApiError(400, 'Send a JSON object.');
  return value as Record<string, unknown>;
}
export function apiError(error: unknown): NextResponse {
  if (error instanceof ApiError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status, headers: { 'Cache-Control': 'no-store' } },
    );
  if (error && typeof error === 'object' && 'code' in error && error.code === '23505')
    return privateJson(
      { error: 'This email or record is already linked to another account. Contact support.' },
      409,
    );
  console.error('[api] Request failed', error instanceof Error ? error.name : 'UnknownError');
  return NextResponse.json(
    { error: 'This operation is temporarily unavailable. Please try again.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
export function privateJson(value: unknown, status = 200): NextResponse {
  return NextResponse.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
