// API route for file upload and processing

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/fileParser";
import { extractFinancialData } from "@/lib/gemini";
import { calculateCashMovements } from "@/lib/cashMovements";
import { createFileJob, updateFileJob } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    // Authentication is optional - allow unauthenticated users
    const { userId } = await auth();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const filename = file.name.toLowerCase();
    const allowedExtensions = [".pdf", ".xlsx", ".xls", ".csv"];
    const isValidFile = allowedExtensions.some((ext) => filename.endsWith(ext));

    if (!isValidFile) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload PDF, Excel, or CSV files." },
        { status: 400 }
      );
    }

    // Create file job (userId can be null for unauthenticated users)
    const jobId = uuidv4();
    const actualUserId = userId || "anonymous";
    
    const fileJob = await createFileJob({
      id: jobId,
      userId: actualUserId,
      filename: file.name,
      status: "uploaded",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Process file asynchronously
    processFileAsync(jobId, file).catch((error) => {
      console.error("Processing error:", error);
      updateFileJob(jobId, {
        status: "failed",
        error: error.message || "Processing failed",
      });
    });

    // Set cookie with job ID for tracking (both anonymous and authenticated users)
    // This ensures files are tracked in BOTH cookie and storage
    const response = NextResponse.json({ jobId, status: "uploaded" });
    
    // Get existing job IDs from cookie
    const cookieHeader = request.cookies.get("uploaded_file_ids");
    const existingIds: string[] = cookieHeader 
      ? JSON.parse(cookieHeader.value || "[]")
      : [];
    
    // Add new job ID if not already present
    // For logged-in users, this provides quick access and session persistence
    // The file is already stored with userId in storage, so we have dual tracking
    if (!existingIds.includes(jobId)) {
      existingIds.push(jobId);
      // Keep only last 50 job IDs to avoid cookie size issues
      const recentIds = existingIds.slice(-50);
      
      response.cookies.set("uploaded_file_ids", JSON.stringify(recentIds), {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: false, // Allow client-side access
        sameSite: "lax",
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

async function processFileAsync(jobId: string, file: File) {
  try {
    // Update status to processing
    await updateFileJob(jobId, { status: "processing" });

    // Parse file
    const parsedContent = await parseFile(file);

    // Extract data using Gemini
    const result = await extractFinancialData(parsedContent.text);

    // Calculate cash movements from transactions (with running balance)
    const calculatedCashMovements = calculateCashMovements(result.transactions);

    // Replace extracted cash movements with calculated ones
    const finalResult = {
      ...result,
      cashMovements: calculatedCashMovements,
    };

    // Update job with result
    await updateFileJob(jobId, {
      status: "completed",
      result: finalResult,
    });
  } catch (error) {
    console.error("Processing error:", error);
    await updateFileJob(jobId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Processing failed",
    });
    throw error;
  }
}

