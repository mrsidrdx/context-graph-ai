import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { loginSchema } from '@/lib/validations';
import { createSession } from '@/lib/auth/session';
import { getSession } from '@/lib/db/neo4j';
import { handleOptions, addCorsHeaders } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      const response = NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    const { email, password } = validationResult.data;
    const neo4jSession = await getSession();

    try {
      const result = await neo4jSession.run(
        'MATCH (u:User {email: $email}) RETURN u',
        { email }
      );

      if (result.records.length === 0) {
        const response = NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
        return addCorsHeaders(response);
      }

      const user = result.records[0].get('u').properties;
      const passwordMatch = await compare(password, user.password);

      if (!passwordMatch) {
        const response = NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
        return addCorsHeaders(response);
      }

      const token = await createSession({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      const response = NextResponse.json({
        success: true,
        token, // Return token to client
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
      return addCorsHeaders(response);
    } finally {
      await neo4jSession.close();
    }
  } catch (error) {
    console.error('Login error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response);
  }
}
