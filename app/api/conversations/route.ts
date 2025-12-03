import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { verifySession } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Conversation } from '@/lib/models/conversation';
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

    await connectToDatabase();
    const conversations = await Conversation.find({ userId: session.userId })
      .select('conversationId title updatedAt messages')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    const formatted = conversations.map((conv) => ({
      id: conv.conversationId,
      title: conv.title,
      updatedAt: conv.updatedAt,
      messageCount: conv.messages?.length || 0,
      preview: conv.messages?.[0]?.content?.slice(0, 100) || '',
    }));

    const response = NextResponse.json({ conversations: formatted });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Get conversations error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response);
    }

    const body = await request.json();
    const { title } = body;

    await connectToDatabase();
    const conversationId = nanoid();

    const conversation = await Conversation.create({
      conversationId,
      userId: session.userId,
      title: title || 'New Conversation',
      messages: [],
    });

    const response = NextResponse.json({
      id: conversation.conversationId,
      title: conversation.title,
      createdAt: conversation.createdAt,
    }, { status: 201 });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Create conversation error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response);
  }
}
