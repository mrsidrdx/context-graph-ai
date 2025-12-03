import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth/session';
import { handleOptions, addCorsHeaders } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST() {
  try {
    await deleteSession();
    const response = NextResponse.json({ success: true });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Logout error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response);
  }
}
