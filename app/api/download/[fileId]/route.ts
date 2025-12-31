// API route for downloading Excel files (preview or full)

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getFileJob } from "@/lib/storage";
import { generateExcel } from "@/lib/excelExport";

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const fileId = params.fileId;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "preview" or "full"

    const job = await getFileJob(fileId);

    if (!job) {
      return NextResponse.json({ error: "File job not found" }, { status: 404 });
    }

    if (job.status !== "completed" || !job.result) {
      return NextResponse.json(
        { error: "File processing not completed" },
        { status: 400 }
      );
    }

    // Check authentication for full version
    if (type === "full") {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { error: "Authentication required for full download" },
          { status: 401 }
        );
      }
      // Verify ownership for full download
      if (job.userId !== "anonymous" && job.userId !== userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Generate Excel
    const isPreview = type === "preview";
    const buffer = generateExcel(job.result, isPreview);

    // Determine filename
    const baseFilename = job.filename.replace(/\.[^/.]+$/, "");
    const filename = isPreview
      ? `${baseFilename}_preview.xlsx`
      : `${baseFilename}_full.xlsx`;

    // Return Excel file
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(buffer);
    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Download failed" },
      { status: 500 }
    );
  }
}

