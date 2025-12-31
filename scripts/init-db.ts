// Script to initialize Neon database schema
// Run this once after setting up your Neon database
// Usage: npx tsx scripts/init-db.ts

// Load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { initializeDatabase } from "../lib/db";

async function main() {
  try {
    console.log("Initializing Neon database schema...");
    await initializeDatabase();
    console.log("✅ Database schema initialized successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    process.exit(1);
  }
}

main();

