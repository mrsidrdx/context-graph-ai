import { streamResponse, analyzeContext } from '@/lib/ai/anthropic';
import { getUserContext, contextToString } from '@/lib/services/context';
import type { GraphContext, EnrichedContext } from '@/lib/types';

const SYSTEM_PROMPT = `You are a context-aware AI assistant with access to the user's personal knowledge graph. Your goal is to provide accurate, personalized responses based on their documents, projects, interests, and concepts.

CONTEXT AVAILABLE:
- Recent documents the user owns
- Topics they're interested in
- Active projects they're working on
- Related concepts and relationships

GUIDELINES:
1. Cite specific documents or projects when referencing information
2. Be concise but comprehensive
3. If context is insufficient, acknowledge limitations
4. Suggest related topics the user might explore
5. Maintain conversation history awareness

RESPONSE FORMAT:
- Start with a direct answer
- Provide supporting details from context
- End with a relevant follow-up question or suggestion (if appropriate)`;

export interface AgentResponse {
  content: string;
  context: GraphContext;
  enrichedContext?: EnrichedContext;
  tokensUsed?: number;
}

export async function* processQuestion(
  userId: string,
  question: string,
  options: {
    maxContextDepth?: 1 | 2 | 3;
    includeVisualization?: boolean;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  } = {}
): AsyncGenerator<
  | { type: 'context'; data: GraphContext }
  | { type: 'enriched'; data: EnrichedContext }
  | { type: 'token'; data: string }
  | { type: 'done'; data: { tokensUsed: number } },
  void,
  unknown
> {
  const { maxContextDepth = 2, conversationHistory = [] } = options;

  const context = await getUserContext(userId, maxContextDepth);
  yield { type: 'context', data: context };

  const contextString = contextToString(context);

  let enrichedContext: EnrichedContext | undefined;
  try {
    enrichedContext = await analyzeContext(contextString, question);
    yield { type: 'enriched', data: enrichedContext };
  } catch (err) {
    console.error('Context enrichment failed:', err);
  }

  const historyString = conversationHistory
    .slice(-10)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  const userMessage = buildUserMessage(
    question,
    contextString,
    enrichedContext,
    historyString
  );

  let tokensUsed = 0;
  for await (const token of streamResponse(SYSTEM_PROMPT, userMessage)) {
    tokensUsed += token.length / 4;
    yield { type: 'token', data: token };
  }

  yield { type: 'done', data: { tokensUsed: Math.round(tokensUsed) } };
}

function buildUserMessage(
  question: string,
  contextString: string,
  enrichedContext: EnrichedContext | undefined,
  historyString: string
): string {
  let message = '';

  if (historyString) {
    message += `CONVERSATION HISTORY:\n${historyString}\n\n`;
  }

  message += `USER CONTEXT:\n${contextString}\n\n`;

  if (enrichedContext) {
    if (enrichedContext.keyInsights.length > 0) {
      message += `KEY INSIGHTS:\n${enrichedContext.keyInsights.map((i) => `- ${i}`).join('\n')}\n\n`;
    }
    if (enrichedContext.missingInformation.length > 0) {
      message += `NOTE - Missing information that might help:\n${enrichedContext.missingInformation.map((i) => `- ${i}`).join('\n')}\n\n`;
    }
    if (enrichedContext.relevantNodes.length > 0) {
      message += `MOST RELEVANT NODES:\n${enrichedContext.relevantNodes
        .slice(0, 5)
        .map((n) => `- ${n.id} (${n.type}): ${n.reason || 'Relevant to query'} [Score: ${Math.round((n.relevanceScore || 0) * 100)}%]`)
        .join('\n')}\n\n`;
    }
  }

  message += `USER QUESTION: ${question}`;

  return message;
}

export async function getQuickResponse(
  userId: string,
  question: string
): Promise<AgentResponse> {
  const context = await getUserContext(userId, 2);
  const contextString = contextToString(context);

  let fullContent = '';
  for await (const token of streamResponse(SYSTEM_PROMPT, `USER CONTEXT:\n${contextString}\n\nUSER QUESTION: ${question}`)) {
    fullContent += token;
  }

  return {
    content: fullContent,
    context,
  };
}
