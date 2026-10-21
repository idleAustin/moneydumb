import { cookies } from 'next/headers';
import crypto from 'crypto';

let devFallbackSecret: Buffer | null = null;

function getSessionSecret(): string | Buffer {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET environment variable is required in production');
  }
  return (devFallbackSecret ??= crypto.randomBytes(32));
}

export function createSessionToken(userId: string): string {
  const secret = getSessionSecret();
  const signature = crypto.createHmac('sha256', secret).update(userId).digest('hex');
  return `${userId}.${signature}`;
}

export async function getAuthUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get('session')?.value;
  if (!raw) return null;

  const lastDot = raw.lastIndexOf('.');
  if (lastDot <= 0) return null;

  const userId = raw.slice(0, lastDot);
  const sig = raw.slice(lastDot + 1);
  if (!/^[0-9a-f]{64}$/i.test(sig)) return null;

  try {
    const secret = getSessionSecret();
    const expected = crypto.createHmac('sha256', secret).update(userId).digest('hex');
    const sigBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
    return userId;
  } catch {
    return null;
  }
}
