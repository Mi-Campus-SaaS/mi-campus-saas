const { Client } = require('pg');

async function createTestDatabase() {
  const dbName = process.env.PGDATABASE || 'micampus_test';
  
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: 'postgres',
  });

  try {
    await client.connect();
    
    const checkDb = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );
    
    if (checkDb.rows.length === 0) {
      console.log(`Creating database: ${dbName}`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database created successfully: ${dbName}`);
    } else {
      console.log(`Database already exists: ${dbName}`);
      await client.query(`DROP DATABASE "${dbName}"`);
      console.log(`Dropped existing database: ${dbName}`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Recreated database: ${dbName}`);
    }
    
    await client.end();
  } catch (error) {
    console.error('Error creating database:', error.message);
    await client.end();
    process.exit(1);
  }
}

createTestDatabase();

