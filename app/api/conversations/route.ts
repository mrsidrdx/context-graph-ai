import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { verifySession } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Conversation } from '@/lib/models/conversation';

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    return NextResponse.json({ conversations: formatted });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    return NextResponse.json({
      id: conversation.conversationId,
      title: conversation.title,
      createdAt: conversation.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
