import { DataSource } from 'typeorm';

// Semaphore to prevent concurrent database resets
let isResettingDatabase = false;
const resetQueue: Array<() => void> = [];

export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;

  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(`DELETE FROM "${entity.tableName}"`);
  }
}

export async function resetDatabase(dataSource: DataSource): Promise<void> {
  if (!dataSource.isInitialized) {
    return;
  }

  // Wait if another reset is in progress
  if (isResettingDatabase) {
    await new Promise<void>((resolve) => {
      resetQueue.push(resolve);
    });
    // After waiting, don't continue - the database is already reset
    return;
  }

  isResettingDatabase = true;

  try {
    // Instead of dropping the database, truncate all tables
    // This is faster and avoids PostgreSQL catalog conflicts
    const entities = dataSource.entityMetadatas;

    // Disable foreign key checks temporarily
    await dataSource.query('SET session_replication_role = replica;');

    // Truncate all tables
    for (const entity of entities) {
      try {
        await dataSource.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
      } catch (error) {
        // Table might not exist yet, ignore
        if (error instanceof Error && !error.message.includes('does not exist')) {
          console.warn(`Failed to truncate ${entity.tableName}:`, error.message);
        }
      }
    }

    // Re-enable foreign key checks
    await dataSource.query('SET session_replication_role = DEFAULT;');

    // If tables don't exist yet, synchronize schema
    try {
      await dataSource.query('SELECT 1 FROM "user" LIMIT 1;');
    } catch {
      // Tables don't exist, need to create them
      await dataSource.synchronize();
    }
  } catch (error) {
    // If all else fails, try the drop/recreate approach with delay
    if (
      error instanceof Error &&
      (error.message.includes('duplicate key') || error.message.includes('already exists'))
    ) {
      console.warn('Falling back to drop/recreate strategy...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        await dataSource.dropDatabase();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await dataSource.synchronize();
      } catch (retryError) {
        console.error('Database reset retry failed:', retryError);
        throw retryError;
      }
    } else {
      throw error;
    }
  } finally {
    isResettingDatabase = false;
    // Process next in queue
    const next = resetQueue.shift();
    if (next) {
      next();
    }
  }
}

export async function closeTestApp(app: any, dataSource: DataSource): Promise<void> {
  try {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  } catch (error) {
    console.warn('Error destroying dataSource:', error);
  }

  try {
    if (app) {
      await app.close();
    }
  } catch (error) {
    console.warn('Error closing app:', error);
  }
}
