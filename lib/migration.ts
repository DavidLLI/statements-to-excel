// Migration utilities for transferring anonymous files to authenticated users

import { getFileJob, updateFileJob, getAllJobs } from "./storage";

/**
 * Transfer anonymous files to a user account
 * Only transfers files that are in the provided cookie job IDs
 * @param cookieJobIds - Array of job IDs from the user's cookie
 * @param userId - The authenticated user's ID
 * @returns Array of transferred job IDs
 */
export async function transferAnonymousFilesToUser(
  cookieJobIds: string[],
  userId: string
): Promise<string[]> {
  const transferredIds: string[] = [];

  // Get all jobs to check for anonymous files
  const allJobs = await getAllJobs();

  // Transfer files that match cookie IDs and are anonymous
  for (const jobId of cookieJobIds) {
    const job = allJobs.find((j) => j.id === jobId);
    
    if (job && job.userId === "anonymous") {
      // Transfer this file to the user
      await updateFileJob(jobId, {
        userId: userId,
      });
      transferredIds.push(jobId);
    }
  }

  return transferredIds;
}

