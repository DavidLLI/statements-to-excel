// API endpoint to migrate anonymous files to authenticated user

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { transferAnonymousFilesToUser } from "@/lib/migration";

const COOKIE_NAME = "uploaded_file_ids";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "User must be authenticated" },
        { status: 401 }
      );
    }

    // Get job IDs from cookie
    const cookieHeader = request.cookies.get(COOKIE_NAME);
    const cookieJobIds: string[] = cookieHeader
      ? JSON.parse(cookieHeader.value || "[]")
      : [];

    if (cookieJobIds.length === 0) {
      return NextResponse.json({
        success: true,
        transferredCount: 0,
        message: "No files to transfer",
      });
    }

    // Transfer anonymous files to user
    const transferredIds = await transferAnonymousFilesToUser(
      cookieJobIds,
      userId
    );

    // Return response with cookie cleared (optional - we can keep it for reference)
    const response = NextResponse.json({
      success: true,
      transferredCount: transferredIds.length,
      transferredIds: transferredIds,
      message: `Successfully transferred ${transferredIds.length} file(s) to your account`,
    });

    // Optionally clear the cookie after transfer, or keep it for reference
    // Keeping it allows users to see their upload history even after login
    // The files API will prioritize userId-based lookup for authenticated users

    return response;
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Migration failed",
      },
      { status: 500 }
    );
  }
}

