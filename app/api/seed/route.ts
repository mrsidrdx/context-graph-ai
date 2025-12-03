import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { seedDataSchema } from '@/lib/validations';
import { verifySession } from '@/lib/auth/session';
import { getSession } from '@/lib/db/neo4j';
import { handleOptions, addCorsHeaders } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response);
    }

    const body = await request.json();

    const validationResult = seedDataSchema.safeParse(body);

    if (!validationResult.success) {
      const response = NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    const seedData = validationResult.data;
    const userId = session.userId;
    const neo4jSession = await getSession();

    const stats = {
      documents: 0,
      topics: 0,
      projects: 0,
      concepts: 0,
      relationships: 0,
    };

    try {
      await neo4jSession.run(
        `MERGE (u:User {id: $userId})
         ON CREATE SET u.created_at = datetime()
         RETURN u`,
        { userId }
      );

      if (seedData.topics) {
        for (const topic of seedData.topics) {
          const topicId = topic.id || `topic_${nanoid(10)}`;
          await neo4jSession.run(
            `MERGE (t:Topic {id: $id})
             SET t.name = $name,
                 t.description = $description,
                 t.category = $category`,
            {
              id: topicId,
              name: topic.name,
              description: topic.description,
              category: topic.category,
            }
          );
          stats.topics++;

          if (topic.relatedTopics) {
            for (const relatedName of topic.relatedTopics) {
              await neo4jSession.run(
                `MATCH (t1:Topic {name: $name1})
                 MERGE (t2:Topic {name: $name2})
                 MERGE (t1)-[r:RELATED_TO]->(t2)
                 SET r.similarity = 0.8`,
                { name1: topic.name, name2: relatedName }
              );
              stats.relationships++;
            }
          }
        }
      }

      if (seedData.concepts) {
        for (const concept of seedData.concepts) {
          const conceptId = concept.id || `concept_${nanoid(10)}`;
          await neo4jSession.run(
            `MERGE (c:Concept {id: $id})
             SET c.name = $name,
                 c.definition = $definition,
                 c.importance_score = $importanceScore`,
            {
              id: conceptId,
              name: concept.name,
              definition: concept.definition,
              importanceScore: concept.importanceScore || 0.5,
            }
          );
          stats.concepts++;

          for (const topicName of concept.topics) {
            await neo4jSession.run(
              `MATCH (c:Concept {name: $conceptName})
               MERGE (t:Topic {name: $topicName})
               MERGE (c)-[:PART_OF]->(t)`,
              { conceptName: concept.name, topicName }
            );
            stats.relationships++;
          }
        }
      }

      if (seedData.documents) {
        for (const doc of seedData.documents) {
          const docId = doc.id || `doc_${nanoid(10)}`;
          const createdAt = doc.createdAt || new Date().toISOString();

          await neo4jSession.run(
            `MATCH (u:User {id: $userId})
             CREATE (d:Document {
               id: $id,
               title: $title,
               content: $content,
               doc_type: $docType,
               created_at: datetime($createdAt),
               updated_at: datetime($createdAt)
             })
             CREATE (u)-[:OWNS]->(d)`,
            {
              userId,
              id: docId,
              title: doc.title,
              content: doc.content,
              docType: doc.docType,
              createdAt,
            }
          );
          stats.documents++;
          stats.relationships++;

          for (const topicName of doc.topics) {
            await neo4jSession.run(
              `MATCH (d:Document {id: $docId})
               MERGE (t:Topic {name: $topicName})
               MERGE (d)-[:TAGGED_WITH {relevance: 0.9}]->(t)`,
              { docId, topicName }
            );
            stats.relationships++;
          }
        }
      }

      if (seedData.projects) {
        for (const project of seedData.projects) {
          const projectId = project.id || `project_${nanoid(10)}`;

          await neo4jSession.run(
            `MATCH (u:User {id: $userId})
             CREATE (p:Project {
               id: $id,
               name: $name,
               description: $description,
               status: $status,
               start_date: datetime($startDate),
               end_date: ${project.endDate ? 'datetime($endDate)' : 'null'}
             })
             CREATE (u)-[:WORKING_ON {role: $role, hours_spent: 0}]->(p)`,
            {
              userId,
              id: projectId,
              name: project.name,
              description: project.description,
              status: project.status,
              startDate: project.startDate,
              endDate: project.endDate,
              role: project.role || 'Contributor',
            }
          );
          stats.projects++;
          stats.relationships++;

          for (const conceptName of project.concepts) {
            await neo4jSession.run(
              `MATCH (p:Project {id: $projectId})
               MERGE (c:Concept {name: $conceptName})
               MERGE (p)-[:USES]->(c)`,
              { projectId, conceptName }
            );
            stats.relationships++;
          }
        }
      }

      if (seedData.userInterests) {
        for (const interest of seedData.userInterests) {
          await neo4jSession.run(
            `MATCH (u:User {id: $userId})
             MERGE (t:Topic {name: $topicName})
             MERGE (u)-[r:INTERESTED_IN]->(t)
             SET r.strength = $strength,
                 r.last_accessed = ${interest.lastAccessed ? 'datetime($lastAccessed)' : 'datetime()'}`,
            {
              userId,
              topicName: interest.topicName,
              strength: interest.strength,
              lastAccessed: interest.lastAccessed,
            }
          );
          stats.relationships++;
        }
      }

      const response = NextResponse.json(
        {
          success: true,
          created: stats,
          userId,
        },
        { status: 201 }
      );
      return addCorsHeaders(response);
    } finally {
      await neo4jSession.close();
    }
  } catch (error) {
    console.error('Seed API error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response);
  }
}
