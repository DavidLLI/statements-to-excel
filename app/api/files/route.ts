// API route to get user's uploaded files

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getFileJob, getAllJobs } from "@/lib/storage";
import { FileJob } from "@/types";

const COOKIE_NAME = "uploaded_file_ids";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    // Get job IDs from cookie (for reference and fallback)
    const cookieHeader = request.cookies.get(COOKIE_NAME);
    const cookieJobIds: string[] = cookieHeader 
      ? JSON.parse(cookieHeader.value || "[]")
      : [];

    // Fetch jobs
    const jobs: FileJob[] = [];
    const jobIdsSet = new Set<string>(); // Track unique job IDs
    
    if (userId) {
      // For authenticated users: prioritize userId-based lookup from storage
      // This ensures all files associated with the user account are shown
      const allJobs = await getAllJobs();
      const userJobs = allJobs.filter(job => job.userId === userId);
      
      for (const job of userJobs) {
        if (!jobIdsSet.has(job.id)) {
          jobs.push(job);
          jobIdsSet.add(job.id);
        }
      }
      
      // Also include any cookie files that might not be migrated yet (fallback)
      // This handles edge cases where migration hasn't completed
      for (const jobId of cookieJobIds) {
        if (!jobIdsSet.has(jobId)) {
          const job = await getFileJob(jobId);
          if (job && (job.userId === userId || job.userId === "anonymous")) {
            jobs.push(job);
            jobIdsSet.add(jobId);
          }
        }
      }
    } else {
      // For anonymous users, get jobs from cookie only
      for (const jobId of cookieJobIds) {
        const job = await getFileJob(jobId);
        if (job && job.userId === "anonymous") {
          jobs.push(job);
        }
      }
    }

    // Sort by most recent first
    jobs.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Get files error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get files" },
      { status: 500 }
    );
  }
}

