import { executeQuery } from '@/lib/db/neo4j';
import { cacheGet, cacheSet } from '@/lib/db/redis';
import type { GraphContext, GraphNode, GraphRelationship } from '@/lib/types';

interface RawNode {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
}

interface RawRelationship {
  startNodeId: string;
  endNodeId: string;
  type: string;
  properties: Record<string, unknown>;
}

export async function getUserContext(
  userId: string,
  depth: 1 | 2 | 3 = 2
): Promise<GraphContext> {
  const cacheKey = `context:${userId}:${depth}`;
  const cached = await cacheGet<GraphContext>(cacheKey);
  if (cached) return cached;

  const query = buildContextQuery(depth);
  const results = await executeQuery<{
    result: { nodes: RawNode[]; relationships: RawRelationship[] };
  }>(query, { userId });

  const context = processResults(results);
  await cacheSet(cacheKey, context, 300);

  return context;
}

function buildContextQuery(depth: 1 | 2 | 3): string {
  if (depth === 1) {
    return `
      MATCH (u:User {id: $userId})
      OPTIONAL MATCH (u)-[r1:INTERESTED_IN]->(t:Topic)
      WITH u, t, r1.strength as topic_strength
      ORDER BY topic_strength DESC
      LIMIT 5
      
      WITH u, collect(DISTINCT {
        id: t.id,
        labels: labels(t),
        properties: properties(t)
      }) as topics
      
      OPTIONAL MATCH (u)-[:OWNS]->(d:Document)
      WHERE d.updated_at > datetime() - duration('P30D')
      WITH u, topics, collect(DISTINCT {
        id: d.id,
        labels: labels(d),
        properties: properties(d)
      })[..10] as documents
      
      OPTIONAL MATCH (u)-[wp:WORKING_ON]->(p:Project)
      WHERE p.status = 'active'
      WITH u, topics, documents, collect(DISTINCT {
        id: p.id,
        labels: labels(p),
        properties: properties(p),
        role: wp.role
      }) as projects
      
      RETURN {
        nodes: [{id: u.id, labels: labels(u), properties: properties(u)}] + topics + documents + projects,
        relationships: []
      } as result
    `;
  }

  if (depth === 2) {
    return `
      MATCH (u:User {id: $userId})
      OPTIONAL MATCH (u)-[r1:INTERESTED_IN]->(t:Topic)
      WITH u, t, r1.strength as topic_strength
      ORDER BY topic_strength DESC
      LIMIT 5
      
      WITH u, collect(DISTINCT {
        id: t.id,
        labels: labels(t),
        properties: properties(t)
      }) as topics
      
      OPTIONAL MATCH (u)-[:OWNS]->(d:Document)
      WHERE d.updated_at > datetime() - duration('P30D')
      WITH u, topics, collect(DISTINCT {
        id: d.id,
        labels: labels(d),
        properties: properties(d)
      })[..10] as documents
      
      OPTIONAL MATCH (u)-[wp:WORKING_ON]->(p:Project)
      WHERE p.status = 'active'
      WITH u, topics, documents, collect(DISTINCT {
        id: p.id,
        labels: labels(p),
        properties: properties(p),
        role: wp.role
      }) as projects
      
      WITH u, topics, documents, projects
      OPTIONAL MATCH (doc:Document)-[tw:TAGGED_WITH]->(t2:Topic)
      WHERE doc.id IN [d.id | d IN documents]
      WITH u, topics, documents, projects, doc,
           collect(DISTINCT {
             id: t2.id,
             labels: labels(t2),
             properties: properties(t2)
           }) as allRelatedTopics,
           collect(DISTINCT {
             startNodeId: doc.id,
             endNodeId: t2.id,
             type: 'TAGGED_WITH',
             properties: properties(tw)
           }) as tagRelationships
      
      WITH u, topics, documents, projects,
           collect(DISTINCT allRelatedTopics) as relatedTopicsCollection,
           collect(DISTINCT tagRelationships) as tagRelationshipsCollection
      
      OPTIONAL MATCH (proj:Project)-[uses:USES]->(c:Concept)
      WHERE proj.id IN [p.id | p IN projects]
      WITH u, topics, documents, projects, relatedTopicsCollection, tagRelationshipsCollection,
           collect(DISTINCT {
             id: c.id,
             labels: labels(c),
             properties: properties(c)
           }) as concepts,
           collect(DISTINCT {
             startNodeId: proj.id,
             endNodeId: c.id,
             type: 'USES',
             properties: properties(uses)
           }) as usesRelationships
      
      WITH u, topics, documents, projects, 
           [item IN relatedTopicsCollection WHERE item IS NOT NULL | item][0] as flatRelatedTopics,
           [item IN tagRelationshipsCollection WHERE item IS NOT NULL | item][0] as flatTagRelationships,
           concepts, usesRelationships
      
      RETURN {
        nodes: [{id: u.id, labels: labels(u), properties: properties(u)}] + topics + documents + projects + coalesce(flatRelatedTopics, []) + concepts,
        relationships: coalesce(flatTagRelationships, []) + usesRelationships
      } as result
    `;
  }

  return `
    MATCH (u:User {id: $userId})
    OPTIONAL MATCH (u)-[r1:INTERESTED_IN]->(t:Topic)
    WITH u, t, r1.strength as topic_strength
    ORDER BY topic_strength DESC
    LIMIT 5
    
    WITH u, collect(DISTINCT {
      id: t.id,
      labels: labels(t),
      properties: properties(t)
    }) as topics
    
    OPTIONAL MATCH (u)-[:OWNS]->(d:Document)
    WHERE d.updated_at > datetime() - duration('P30D')
    WITH u, topics, collect(DISTINCT {
      id: d.id,
      labels: labels(d),
      properties: properties(d)
    })[..10] as documents
    
    OPTIONAL MATCH (u)-[wp:WORKING_ON]->(p:Project)
    WHERE p.status = 'active'
    WITH u, topics, documents, collect(DISTINCT {
      id: p.id,
      labels: labels(p),
      properties: properties(p),
      role: wp.role
    }) as projects
    
    WITH u, topics, documents, projects
    OPTIONAL MATCH (doc:Document)-[tw:TAGGED_WITH]->(t2:Topic)
    WHERE doc.id IN [d.id | d IN documents]
    WITH u, topics, documents, projects,
         collect(DISTINCT {
           id: t2.id,
           labels: labels(t2),
           properties: properties(t2)
         }) as relatedTopics,
         collect(DISTINCT {
           startNodeId: doc.id,
           endNodeId: t2.id,
           type: 'TAGGED_WITH',
           properties: properties(tw)
         }) as tagRelationships
    
    OPTIONAL MATCH (proj:Project)-[uses:USES]->(c:Concept)
    WHERE proj.id IN [p.id | p IN projects]
    WITH u, topics, documents, projects, relatedTopics, tagRelationships,
         collect(DISTINCT {
           id: c.id,
           labels: labels(c),
           properties: properties(c)
         }) as concepts,
         collect(DISTINCT {
           startNodeId: proj.id,
           endNodeId: c.id,
           type: 'USES',
           properties: properties(uses)
         }) as usesRelationships
    
    OPTIONAL MATCH (con:Concept)-[po:PART_OF]->(t3:Topic)
    WHERE con.id IN [c.id | c IN concepts]
    WITH u, topics, documents, projects, relatedTopics, concepts, tagRelationships, usesRelationships,
         collect(DISTINCT {
           id: t3.id,
           labels: labels(t3),
           properties: properties(t3)
         }) as conceptTopics,
         collect(DISTINCT {
           startNodeId: con.id,
           endNodeId: t3.id,
           type: 'PART_OF',
           properties: properties(po)
         }) as partOfRelationships
    
    OPTIONAL MATCH (top:Topic)-[rt:RELATED_TO]->(t4:Topic)
    WHERE top.id IN [t.id | t IN topics]
    WITH u, topics, documents, projects, relatedTopics, concepts, conceptTopics, tagRelationships, usesRelationships, partOfRelationships,
         collect(DISTINCT {
           id: t4.id,
           labels: labels(t4),
           properties: properties(t4)
         }) as linkedTopics,
         collect(DISTINCT {
           startNodeId: top.id,
           endNodeId: t4.id,
           type: 'RELATED_TO',
           properties: properties(rt)
         }) as relatedToRelationships
    
    RETURN {
      nodes: [{id: u.id, labels: labels(u), properties: properties(u)}] + topics + documents + projects + relatedTopics + concepts + conceptTopics + linkedTopics,
      relationships: tagRelationships + usesRelationships + partOfRelationships + relatedToRelationships
    } as result
  `;
}

function processResults(
  results: Array<{ result: { nodes: RawNode[]; relationships: RawRelationship[] } }>
): GraphContext {
  if (!results.length || !results[0]?.result) {
    return { nodes: [], relationships: [] };
  }

  const { nodes: rawNodes, relationships: rawRelationships } = results[0].result;

  const nodeMap = new Map<string, GraphNode>();
  for (const node of rawNodes) {
    if (node && node.id && !nodeMap.has(node.id)) {
      nodeMap.set(node.id, {
        id: node.id,
        type: mapLabelToType(node.labels),
        properties: node.properties || {},
      });
    }
  }

  const relationships: GraphRelationship[] = [];
  for (const rel of rawRelationships) {
    if (rel && rel.startNodeId && rel.endNodeId) {
      relationships.push({
        from: rel.startNodeId,
        to: rel.endNodeId,
        type: rel.type,
        properties: rel.properties || {},
      });
    }
  }

  const nodes = Array.from(nodeMap.values());
  
  // Calculate statistics
  const nodeTypes = nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const relationshipTypes = relationships.reduce((acc, rel) => {
    acc[rel.type] = (acc[rel.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const relevantNodes = nodes.filter(node => node.relevanceScore && node.relevanceScore > 0.5).length;

  return {
    nodes,
    relationships,
    statistics: {
      totalNodes: nodes.length,
      totalRelationships: relationships.length,
      relevantNodes,
      nodeTypes,
      relationshipTypes,
    },
  };
}

function mapLabelToType(
  labels: string[]
): 'User' | 'Document' | 'Topic' | 'Project' | 'Concept' {
  if (labels.includes('User')) return 'User';
  if (labels.includes('Document')) return 'Document';
  if (labels.includes('Topic')) return 'Topic';
  if (labels.includes('Project')) return 'Project';
  if (labels.includes('Concept')) return 'Concept';
  return 'Topic';
}

export function contextToString(context: GraphContext): string {
  const sections: string[] = [];

  const userNodes = context.nodes.filter((n) => n.type === 'User');
  const documents = context.nodes.filter((n) => n.type === 'Document');
  const topics = context.nodes.filter((n) => n.type === 'Topic');
  const projects = context.nodes.filter((n) => n.type === 'Project');
  const concepts = context.nodes.filter((n) => n.type === 'Concept');

  if (userNodes.length > 0) {
    sections.push(`USER: ${userNodes[0].properties.name || userNodes[0].id}`);
  }

  if (documents.length > 0) {
    sections.push('\nDOCUMENTS:');
    for (const doc of documents) {
      sections.push(
        `- ${doc.properties.title} (${doc.properties.doc_type}): ${String(doc.properties.content).slice(0, 200)}...`
      );
    }
  }

  if (topics.length > 0) {
    sections.push('\nTOPICS OF INTEREST:');
    for (const topic of topics) {
      sections.push(`- ${topic.properties.name}: ${topic.properties.description}`);
    }
  }

  if (projects.length > 0) {
    sections.push('\nACTIVE PROJECTS:');
    for (const project of projects) {
      sections.push(
        `- ${project.properties.name} (${project.properties.status}): ${project.properties.description}`
      );
    }
  }

  if (concepts.length > 0) {
    sections.push('\nKEY CONCEPTS:');
    for (const concept of concepts) {
      sections.push(`- ${concept.properties.name}: ${concept.properties.definition}`);
    }
  }

  if (context.relationships.length > 0) {
    sections.push('\nRELATIONSHIPS:');
    for (const rel of context.relationships.slice(0, 20)) {
      sections.push(`- ${rel.from} --[${rel.type}]--> ${rel.to}`);
    }
  }

  return sections.join('\n');
}
