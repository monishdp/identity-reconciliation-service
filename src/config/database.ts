import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false 
  }
});

// Function to initialize the database with the Contact table
export async function initializeDatabase() {
  try {
    console.log('Attempting to connect to database...');
    const maskedUrl = databaseUrl!.replace(/:[^:]*@/, ':****@'); 
    console.log(`Using DATABASE_URL: ${maskedUrl}`); // Log URL with password redacted
    
    // Test the connection first
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20),
        email VARCHAR(255),
        linked_id INTEGER,
        link_precedence VARCHAR(10) NOT NULL CHECK (link_precedence IN ('primary', 'secondary')),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export default pool;