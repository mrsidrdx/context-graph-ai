import neo4j, { Driver, Session, Record as Neo4jRecord } from 'neo4j-driver';

let driver: Driver | null = null;

function getDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI;
    const username = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !username || !password) {
      throw new Error('Neo4j environment variables not configured');
    }

    driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 30000,
    });
  }
  return driver;
}

export async function getSession(): Promise<Session> {
  return getDriver().session();
}

export async function executeQuery<T>(
  query: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session = await getSession();
  try {
    const result = await session.run(query, params);
    return result.records.map((record: Neo4jRecord) => record.toObject() as T);
  } finally {
    await session.close();
  }
}

export async function executeSingleQuery<T>(
  query: string,
  params: Record<string, unknown> = {}
): Promise<T | null> {
  const results = await executeQuery<T>(query, params);
  return results[0] || null;
}

export async function executeWrite<T>(
  query: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session = await getSession();
  try {
    const result = await session.executeWrite(async (tx) => {
      return tx.run(query, params);
    });
    return result.records.map((record: Neo4jRecord) => record.toObject() as T);
  } finally {
    await session.close();
  }
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

export { neo4j };
