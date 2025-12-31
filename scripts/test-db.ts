// Test script to verify Neon database connection
// Usage: npx tsx scripts/test-db.ts

// Load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "path";

const result = config({ path: resolve(process.cwd(), ".env.local") });

if (result.error) {
  console.error("Error loading .env.local:", result.error);
} else {
  console.log(`✅ Loaded ${Object.keys(result.parsed || {}).length} environment variables`);
  if (!process.env.DATABASE_URL) {
    console.log("⚠️  DATABASE_URL not found. Available keys:", Object.keys(result.parsed || {}));
  }
}

import { sql } from "../lib/db";

async function testConnection() {
  try {
    console.log("Testing Neon database connection...");
    
    // Test 1: Simple query
    const result = await sql`SELECT NOW() as current_time, version() as pg_version` as any[];
    console.log("✅ Connection successful!");
    if (Array.isArray(result) && result.length > 0) {
      console.log("Current time:", result[0].current_time);
      console.log("PostgreSQL version:", result[0].pg_version.split(" ")[0] + " " + result[0].pg_version.split(" ")[1]);
    }
    
    // Test 2: Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'file_jobs'
      ) as table_exists
    ` as any[];
    
    if (Array.isArray(tableCheck) && tableCheck.length > 0 && tableCheck[0].table_exists) {
      console.log("✅ file_jobs table exists");
      
      // Test 3: Count records
      const count = await sql`SELECT COUNT(*) as count FROM file_jobs` as any[];
      if (Array.isArray(count) && count.length > 0) {
        console.log(`📊 Total file jobs: ${count[0].count}`);
      }
    } else {
      console.log("⚠️  file_jobs table does not exist yet");
      console.log("   Run: npx tsx scripts/init-db.ts to create it");
    }
    
    console.log("\n✅ All tests passed! Database is ready to use.");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Database connection failed:");
    console.error("Error:", error.message);
    
    if (error.message.includes("DATABASE_URL")) {
      console.error("\n💡 Make sure DATABASE_URL is set in your .env.local file");
    } else if (error.message.includes("password") || error.message.includes("authentication")) {
      console.error("\n💡 Check your database credentials in .env.local");
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
      console.error("\n💡 Check your database host/connection string");
    }
    
    process.exit(1);
  }
}

testConnection();

