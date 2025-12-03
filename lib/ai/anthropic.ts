import Anthropic from '@anthropic-ai/sdk';
import type { EnrichedContext, GraphNode } from '@/lib/types';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable not configured');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

export async function generateResponse(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 4096
): Promise<string> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock?.type === 'text' ? textBlock.text : '';
}

export async function* streamResponse(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 4096
): AsyncGenerator<string, void, unknown> {
  const anthropic = getClient();

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}

export async function analyzeContext(
  context: string,
  question: string
): Promise<EnrichedContext> {
  const anthropic = getClient();

  const prompt = `Given this user context graph:
${context}

And this user question:
"${question}"

Analyze and enrich the context by:
1. Identifying the most relevant nodes and relationships
2. Scoring each element's relevance (0-1)
3. Extracting key insights that connect to the question
4. Flagging any missing information that would improve the answer

Return ONLY valid JSON with this exact structure:
{
  "relevantNodes": [{"id": "string", "type": "Document|Project|Topic|Concept", "properties": {}, "relevanceScore": 0.0, "reason": "string"}],
  "keyInsights": ["string"],
  "missingInformation": ["string"],
  "recommendedDepth": 1
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  const text = textBlock?.type === 'text' ? textBlock.text : '{}';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Ensure relevantNodes are properly typed as GraphNode
      const relevantNodes: GraphNode[] = (parsed.relevantNodes || []).map((node: any) => ({
        id: node.id || '',
        type: node.type || 'Topic',
        properties: node.properties || {},
        relevanceScore: node.relevanceScore || 0,
        reason: node.reason || '',
      }));
      
      return {
        relevantNodes,
        keyInsights: parsed.keyInsights || [],
        missingInformation: parsed.missingInformation || [],
        recommendedDepth: parsed.recommendedDepth || 2,
      };
    }
    return {
      relevantNodes: [],
      keyInsights: [],
      missingInformation: [],
      recommendedDepth: 2,
    };
  } catch {
    return {
      relevantNodes: [],
      keyInsights: [],
      missingInformation: [],
      recommendedDepth: 2,
    };
  }
}

export { getClient };
