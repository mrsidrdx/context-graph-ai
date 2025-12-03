import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Conversation } from '@/lib/models/conversation';
import { handleOptions, addCorsHeaders } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const { conversationId } = await params;
    await connectToDatabase();
    
    const conversation = await Conversation.findOne({
      conversationId,
      userId: session.userId,
    }).lean();

    if (!conversation) {
      return addCorsHeaders(NextResponse.json({ error: 'Conversation not found' }, { status: 404 }));
    }

    return addCorsHeaders(NextResponse.json({
      id: conversation.conversationId,
      title: conversation.title,
      messages: conversation.messages,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    }));
  } catch (error) {
    console.error('Get conversation error:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

export async function PATCH(
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
    const { title } = body;

    await connectToDatabase();
    
    const conversation = await Conversation.findOneAndUpdate(
      { conversationId, userId: session.userId },
      { title },
      { new: true }
    );

    if (!conversation) {
      return addCorsHeaders(NextResponse.json({ error: 'Conversation not found' }, { status: 404 }));
    }

    return addCorsHeaders(NextResponse.json({
      id: conversation.conversationId,
      title: conversation.title,
    }));
  } catch (error) {
    console.error('Update conversation error:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const { conversationId } = await params;
    await connectToDatabase();
    
    const result = await Conversation.deleteOne({
      conversationId,
      userId: session.userId,
    });

    if (result.deletedCount === 0) {
      return addCorsHeaders(NextResponse.json({ error: 'Conversation not found' }, { status: 404 }));
    }

    return addCorsHeaders(NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Delete conversation error:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
