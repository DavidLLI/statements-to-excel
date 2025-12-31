// Neon database connection
// Uses serverless driver optimized for Vercel Edge Functions and Serverless Functions

import { neon } from "@neondatabase/serverless";

// Get database URL from environment variable
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // Don't throw error at module load time - allow lazy initialization
  // This allows dotenv to load first in scripts
}

// Create Neon client - returns a function that accepts SQL template literals
// Initialize lazily to allow environment variables to load first
function getSqlClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(url);
}

// Export sql as a template tag function
export const sql = ((strings: TemplateStringsArray, ...values: any[]) => {
  return getSqlClient()(strings, ...values);
}) as ReturnType<typeof neon>;

// Initialize database schema (run this once to set up tables)
export async function initializeDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS file_jobs (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        filename VARCHAR(500) NOT NULL,
        status VARCHAR(50) NOT NULL,
        result JSONB,
        error TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_file_jobs_user_id ON file_jobs(user_id)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_file_jobs_created_at ON file_jobs(created_at DESC)
    `;
    
    console.log("Database schema initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database schema:", error);
    throw error;
  }
}

