import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { handleOptions, addCorsHeaders } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    const session = await verifySession();

    if (!session) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response);
    }

    const response = NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
      },
    });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Auth check error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response);
  }
}
