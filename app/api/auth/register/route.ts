import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { nanoid } from 'nanoid';
import { registerSchema } from '@/lib/validations';
import { createSession } from '@/lib/auth/session';
import { getSession } from '@/lib/db/neo4j';
import { handleOptions, addCorsHeaders } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      const response = NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    const { email, password, name } = validationResult.data;
    const neo4jSession = await getSession();

    try {
      const existingUser = await neo4jSession.run(
        'MATCH (u:User {email: $email}) RETURN u',
        { email }
      );

      if (existingUser.records.length > 0) {
        const response = NextResponse.json(
          { error: 'User already exists' },
          { status: 409 }
        );
        return addCorsHeaders(response);
      }

      const hashedPassword = await hash(password, 12);
      const userId = `user_${nanoid(10)}`;

      await neo4jSession.run(
        `CREATE (u:User {
          id: $id,
          email: $email,
          name: $name,
          password: $password,
          created_at: datetime()
        }) RETURN u`,
        {
          id: userId,
          email,
          name,
          password: hashedPassword,
        }
      );

      const token = await createSession({ userId, email, name });

      const response = NextResponse.json(
        {
          success: true,
          token, // Return token to client
          user: { id: userId, email, name },
        },
        { status: 201 }
      );
      return addCorsHeaders(response);
    } finally {
      await neo4jSession.close();
    }
  } catch (error) {
    console.error('Register error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response);
  }
}
