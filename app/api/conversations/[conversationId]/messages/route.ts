import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { verifySession } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Conversation, IMessage } from '@/lib/models/conversation';
import { handleOptions, addCorsHeaders } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const { conversationId } = await params;
    const body = await request.json();
    const { role, content, contextUsed } = body;

    if (!role || !content) {
      return addCorsHeaders(NextResponse.json({ error: 'Role and content are required' }, { status: 400 }));
    }

    await connectToDatabase();

    const message: IMessage = {
      id: nanoid(),
      role,
      content,
      timestamp: new Date(),
      contextUsed,
    };

    const conversation = await Conversation.findOneAndUpdate(
      { conversationId, userId: session.userId },
      { 
        $push: { messages: message },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );

    if (!conversation) {
      return addCorsHeaders(NextResponse.json({ error: 'Conversation not found' }, { status: 404 }));
    }

    // Auto-update title from first user message
    if (conversation.messages.length === 1 && role === 'user') {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      await Conversation.updateOne(
        { conversationId },
        { title }
      );
    }

    return addCorsHeaders(NextResponse.json({ message }, { status: 201 }));
  } catch (error) {
    console.error('Add message error:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
