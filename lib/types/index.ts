export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  preferences?: Record<string, unknown>;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  docType: 'note' | 'article' | 'reference' | 'research';
  createdAt: Date;
  updatedAt: Date;
  embeddingVector?: number[];
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface Concept {
  id: string;
  name: string;
  definition: string;
  importanceScore: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  startDate: Date;
  endDate?: Date;
}

export interface GraphNode {
  id: string;
  type: 'User' | 'Document' | 'Topic' | 'Project' | 'Concept';
  properties: Record<string, unknown>;
  relevanceScore?: number;
  reason?: string;
}

export interface GraphRelationship {
  from: string;
  to: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface GraphContext {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  statistics?: {
    totalNodes: number;
    totalRelationships: number;
    relevantNodes: number;
    nodeTypes: Record<string, number>;
    relationshipTypes: Record<string, number>;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  streaming?: boolean;
  contextUsed?: {
    documentCount: number;
    topicCount: number;
    projectCount: number;
  };
  contextGraph?: GraphContext;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  options?: {
    includeVisualization: boolean;
    maxContextDepth: 1 | 2 | 3;
  };
}

export interface StreamEvent {
  type: 'token' | 'context' | 'done' | 'error';
  data: unknown;
}

export interface SeedData {
  userId: string;
  documents?: Array<{
    id?: string;
    title: string;
    content: string;
    docType: 'note' | 'article' | 'reference' | 'research';
    topics: string[];
    createdAt?: string;
    metadata?: Record<string, unknown>;
  }>;
  topics?: Array<{
    id?: string;
    name: string;
    description: string;
    category: string;
    relatedTopics?: string[];
  }>;
  projects?: Array<{
    id?: string;
    name: string;
    description: string;
    status: 'active' | 'completed' | 'archived';
    startDate: string;
    endDate?: string;
    concepts: string[];
    role?: string;
  }>;
  concepts?: Array<{
    id?: string;
    name: string;
    definition: string;
    importanceScore?: number;
    topics: string[];
  }>;
  userInterests?: Array<{
    topicName: string;
    strength: number;
    lastAccessed?: string;
  }>;
}

export interface SeedResponse {
  success: boolean;
  created: {
    documents: number;
    topics: number;
    projects: number;
    concepts: number;
    relationships: number;
  };
  userId: string;
}

export interface EnrichedContext {
  relevantNodes: GraphNode[];
  keyInsights: string[];
  missingInformation: string[];
  recommendedDepth: 1 | 2 | 3;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  expiresAt: Date;
}
