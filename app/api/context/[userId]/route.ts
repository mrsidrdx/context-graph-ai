import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { getUserContext } from '@/lib/services/context';
import { handleOptions, addCorsHeaders } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const { userId } = await params;

    if (session.userId !== userId) {
      return addCorsHeaders(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const searchParams = request.nextUrl.searchParams;
    const depth = parseInt(searchParams.get('depth') || '2') as 1 | 2 | 3;
    const validDepth = [1, 2, 3].includes(depth) ? depth : 2;

    const context = await getUserContext(userId, validDepth as 1 | 2 | 3);

    return addCorsHeaders(NextResponse.json(context));
  } catch (error) {
    console.error('Context API error:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
