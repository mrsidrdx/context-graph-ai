import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { nanoid } from 'nanoid';
import { registerSchema } from '@/lib/validations';
import { createSession } from '@/lib/auth/session';
import { getSession } from '@/lib/db/neo4j';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { email, password, name } = validationResult.data;
    const neo4jSession = await getSession();

    try {
      const existingUser = await neo4jSession.run(
        'MATCH (u:User {email: $email}) RETURN u',
        { email }
      );

      if (existingUser.records.length > 0) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 409 }
        );
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

      await createSession({ userId, email, name });

      return NextResponse.json(
        {
          success: true,
          user: { id: userId, email, name },
        },
        { status: 201 }
      );
    } finally {
      await neo4jSession.close();
    }
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
