import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';

const SEED_TEMPLATES = {
  developer: {
    name: 'Software Developer',
    description: 'Template for software engineers with system design, DevOps, and architecture knowledge',
    filename: 'seed-developer.json',
  },
  researcher: {
    name: 'AI Researcher',
    description: 'Template for AI/ML researchers with deep learning and NLP knowledge',
    filename: 'seed-researcher.json',
  },
  blank: {
    name: 'Blank Template',
    description: 'Empty template with structure for custom knowledge base',
    filename: 'seed-blank.json',
  },
};

const BLANK_TEMPLATE = {
  userId: 'your_user_id',
  documents: [
    {
      title: 'Example Document',
      content: 'Your document content here...',
      docType: 'note',
      topics: ['Topic 1', 'Topic 2'],
      createdAt: new Date().toISOString(),
    },
  ],
  topics: [
    {
      name: 'Topic 1',
      description: 'Description of the topic',
      category: 'Category',
      relatedTopics: ['Topic 2'],
    },
  ],
  projects: [
    {
      name: 'Project Name',
      description: 'Project description',
      status: 'active',
      startDate: new Date().toISOString(),
      concepts: ['Concept 1'],
      role: 'Your Role',
    },
  ],
  concepts: [
    {
      name: 'Concept 1',
      definition: 'Definition of the concept',
      importanceScore: 0.8,
      topics: ['Topic 1'],
    },
  ],
  userInterests: [
    {
      topicName: 'Topic 1',
      strength: 0.9,
      lastAccessed: new Date().toISOString(),
    },
  ],
};

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ templates: SEED_TEMPLATES });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return blank template with user's ID pre-filled
    const template = {
      ...BLANK_TEMPLATE,
      userId: session.userId,
    };

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Get blank template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
