import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Default connection string from Neon.new provisioning
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Nucm2zPEGw4b@ep-empty-block-ajbp0sfn-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require';

console.log('Target Connection:', connectionString.split('@')[1] || connectionString);

const sql = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf8');

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const runMigration = async () => {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected. Running migration schema.sql...');
    await client.query(sql);
    console.log('Database migrated and seeded successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
};

runMigration();
