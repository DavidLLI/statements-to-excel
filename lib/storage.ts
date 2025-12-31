// Neon database storage for FileJobs
// Replaces file-based storage for Vercel deployment

import { FileJob, ExtractionResult } from "@/types";
import { sql } from "./db";

// Initialize database on first import (optional - can be called manually)
let initialized = false;
export async function ensureInitialized() {
  if (!initialized) {
    try {
      // Check if table exists by trying to query it
      await sql`SELECT 1 FROM file_jobs LIMIT 1`;
      initialized = true;
    } catch (error: any) {
      // Table doesn't exist, initialize it
      if (error.code === "42P01") {
        // PostgreSQL error code for "relation does not exist"
        const { initializeDatabase } = await import("./db");
        await initializeDatabase();
        initialized = true;
      } else {
        throw error;
      }
    }
  }
}

export async function createFileJob(job: FileJob): Promise<FileJob> {
  await ensureInitialized();
  
  await sql`
    INSERT INTO file_jobs (id, user_id, filename, status, result, error, created_at, updated_at)
    VALUES (
      ${job.id},
      ${job.userId},
      ${job.filename},
      ${job.status},
      ${job.result ? JSON.stringify(job.result) : null},
      ${job.error || null},
      ${job.createdAt},
      ${job.updatedAt}
    )
  `;
  
  return job;
}

export async function getFileJob(id: string): Promise<FileJob | null> {
  await ensureInitialized();
  
  const result = await sql`
    SELECT 
      id,
      user_id as "userId",
      filename,
      status,
      result,
      error,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM file_jobs
    WHERE id = ${id}
    LIMIT 1
  `;
  
  if (result.length === 0) {
    return null;
  }
  
  const row = result[0] as any;
  return {
    id: row.id,
    userId: row.userId,
    filename: row.filename,
    status: row.status,
    result: row.result as ExtractionResult | undefined,
    error: row.error || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function updateFileJob(
  id: string,
  updates: Partial<FileJob>
): Promise<FileJob | null> {
  await ensureInitialized();
  
  // Get current job first
  const currentJob = await getFileJob(id);
  if (!currentJob) {
    return null;
  }
  
  // Merge updates with current job
  const updatedJob: FileJob = {
    ...currentJob,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  // Update all fields (simpler approach for Neon)
  await sql`
    UPDATE file_jobs
    SET 
      user_id = ${updatedJob.userId},
      filename = ${updatedJob.filename},
      status = ${updatedJob.status},
      result = ${updatedJob.result ? JSON.stringify(updatedJob.result) : null}::jsonb,
      error = ${updatedJob.error || null},
      updated_at = ${updatedJob.updatedAt}
    WHERE id = ${id}
  `;
  
  return updatedJob;
}

export async function getUserFileJobs(userId: string): Promise<FileJob[]> {
  await ensureInitialized();
  
  const result = await sql`
    SELECT 
      id,
      user_id as "userId",
      filename,
      status,
      result,
      error,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM file_jobs
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  
  return result.map((row: any) => ({
    id: row.id,
    userId: row.userId,
    filename: row.filename,
    status: row.status,
    result: row.result as ExtractionResult | undefined,
    error: row.error || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function getAllJobs(): Promise<FileJob[]> {
  await ensureInitialized();
  
  const result = await sql`
    SELECT 
      id,
      user_id as "userId",
      filename,
      status,
      result,
      error,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM file_jobs
    ORDER BY created_at DESC
  `;
  
  return result.map((row: any) => ({
    id: row.id,
    userId: row.userId,
    filename: row.filename,
    status: row.status,
    result: row.result as ExtractionResult | undefined,
    error: row.error || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}
