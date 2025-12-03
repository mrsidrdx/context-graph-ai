import { z } from 'zod';

export const chatRequestSchema = z.object({
  message: z.string().min(1).max(500),
  conversationId: z.string().min(1),
  sessionId: z.string().optional(),
  options: z
    .object({
      includeVisualization: z.boolean().default(false),
      maxContextDepth: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
    })
    .optional(),
});

export const seedDataSchema = z.object({
  documents: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().min(1).max(200),
        content: z.string().min(1).max(10000),
        docType: z.enum(['note', 'article', 'reference', 'research']),
        topics: z.array(z.string()),
        createdAt: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .optional(),
  topics: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1).max(100),
        description: z.string().min(1).max(500),
        category: z.string().min(1).max(50),
        relatedTopics: z.array(z.string()).optional(),
      })
    )
    .optional(),
  projects: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1).max(200),
        description: z.string().min(1).max(1000),
        status: z.enum(['active', 'completed', 'archived']),
        startDate: z.string(),
        endDate: z.string().optional(),
        concepts: z.array(z.string()),
        role: z.string().optional(),
      })
    )
    .optional(),
  concepts: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1).max(100),
        definition: z.string().min(1).max(500),
        importanceScore: z.number().min(0).max(1).optional(),
        topics: z.array(z.string()),
      })
    )
    .optional(),
  userInterests: z
    .array(
      z.object({
        topicName: z.string(),
        strength: z.number().min(0).max(1),
        lastAccessed: z.string().optional(),
      })
    )
    .optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  name: z.string().min(2).max(100),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type SeedData = z.infer<typeof seedDataSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
