// API route for checking file processing status

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getFileJob } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    // Authentication is optional - allow unauthenticated users to check status
    const { userId } = await auth();

    const fileId = params.fileId;

    const job = await getFileJob(fileId);

    if (!job) {
      return NextResponse.json({ error: "File job not found" }, { status: 404 });
    }

    // Allow access if user owns the job OR if job is anonymous (no auth required)
    // For authenticated users, verify ownership only if job is not anonymous
    if (userId && job.userId !== "anonymous" && job.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const response = NextResponse.json(job);
    // Prevent caching to ensure fresh status
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Status check failed" },
      { status: 500 }
    );
  }
}

