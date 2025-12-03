import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { SessionPayload } from '@/lib/types';

const secretKey = process.env.JWT_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function createSession(payload: Omit<SessionPayload, 'expiresAt'>): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const token = await new SignJWT({ ...payload, expiresAt: expiresAt.toISOString() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);

  return token;
}

export async function verifySession(): Promise<SessionPayload | null> {
  // Try Authorization header first (modern approach)
  const { headers } = await import('next/headers');
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  
  let token: string | undefined;
  
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  
  // Fallback to cookie for backwards compatibility
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get('session')?.value;
  }

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });

    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  // Client will remove token from localStorage
  // Clear cookie if it exists for backwards compatibility
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function getSessionFromToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });

    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
