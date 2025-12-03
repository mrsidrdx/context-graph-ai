import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { chatRequestSchema } from '@/lib/validations';
import { verifySession } from '@/lib/auth/session';
import { rateLimitCheck } from '@/lib/db/redis';
import { processQuestion } from '@/lib/services/agent';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Conversation } from '@/lib/models/conversation';

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rateLimit = await rateLimitCheck(session.userId, 20, 60);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          resetIn: rateLimit.resetIn,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await request.json();
    const validationResult = chatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validationResult.error.issues,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { message, options, conversationId } = validationResult.data;
    const messageId = nanoid();
    
    // Verify conversation exists
    await connectToDatabase();
    
    const existingConversation = await Conversation.findOne({
      conversationId,
      userId: session.userId,
    });
    
    if (!existingConversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Save user message
    const userMessage = {
      id: nanoid(),
      role: 'user' as const,
      content: message,
      timestamp: new Date(),
    };
    
    await Conversation.findOneAndUpdate(
      { conversationId, userId: session.userId },
      { 
        $push: { messages: userMessage },
        $set: { updatedAt: new Date() }
      }
    );

    const encoder = new TextEncoder();
    let capturedContext: any = null;
    let fullResponse = '';
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send conversationId immediately
          const convData = `data: ${JSON.stringify({ conversationId })}\n\n`;
          controller.enqueue(encoder.encode(convData));
          
          for await (const event of processQuestion(session.userId, message, {
            maxContextDepth: options?.maxContextDepth,
            includeVisualization: options?.includeVisualization,
          })) {
            let data: string;

            switch (event.type) {
              case 'context':
                capturedContext = event.data;
                data = `data: ${JSON.stringify({ context: event.data })}\n\n`;
                break;
              case 'enriched':
                data = `data: ${JSON.stringify({ enrichedContext: event.data })}\n\n`;
                break;
              case 'token':
                fullResponse += event.data;
                data = `data: ${JSON.stringify({ content: event.data })}\n\n`;
                break;
              case 'done':
                // Save assistant message with context
                const assistantMessage = {
                  id: nanoid(),
                  role: 'assistant' as const,
                  content: fullResponse,
                  timestamp: new Date(),
                  contextUsed: capturedContext ? {
                    documentCount: capturedContext.nodes.filter((n: any) => n.type === 'Document').length,
                    topicCount: capturedContext.nodes.filter((n: any) => n.type === 'Topic').length,
                    projectCount: capturedContext.nodes.filter((n: any) => n.type === 'Project').length,
                  } : undefined,
                  contextGraph: capturedContext || undefined,
                };
                
                await Conversation.findOneAndUpdate(
                  { conversationId, userId: session.userId },
                  { 
                    $push: { messages: assistantMessage },
                    $set: { updatedAt: new Date() }
                  }
                );
                
                data = `data: ${JSON.stringify({ done: true, messageId, conversationId, ...event.data })}\n\n`;
                break;
            }

            controller.enqueue(encoder.encode(data));
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: errorMessage })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
