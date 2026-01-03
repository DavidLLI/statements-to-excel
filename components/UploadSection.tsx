"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { FileJob } from "@/types";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

export default function UploadSection() {
  const { user, isLoaded } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileJob[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<{ shouldContinue: boolean; intervalId: NodeJS.Timeout | null }>({
    shouldContinue: true,
    intervalId: null,
  });

  // Track section view on mount
  useEffect(() => {
    if (sectionRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              trackEvent("upload_section_viewed");
              observer.disconnect();
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(sectionRef.current);
      return () => observer.disconnect();
    }
  }, []);

  // Fetch uploaded files on mount and poll for updates
  useEffect(() => {
    const fetchFiles = async (showLoading = false) => {
      if (!pollingRef.current.shouldContinue) return;

      if (showLoading) {
        setLoadingFiles(true);
      }
      try {
        const response = await fetch("/api/files");
        if (response.ok) {
          const data = await response.json();
          setUploadedFiles(data.jobs || []);
          
          // Stop polling if all files are completed or failed (but only if there are files)
          if (data.jobs.length > 0) {
            const allFinished = data.jobs.every(
              (job: FileJob) => job.status === "completed" || job.status === "failed"
            );
            if (allFinished) {
              pollingRef.current.shouldContinue = false;
              if (pollingRef.current.intervalId) {
                clearInterval(pollingRef.current.intervalId);
                pollingRef.current.intervalId = null;
              }
            } else {
              // If there are files still processing, ensure polling continues
              pollingRef.current.shouldContinue = true;
              // Restart polling if it was stopped
              if (!pollingRef.current.intervalId) {
                pollingRef.current.intervalId = setInterval(() => {
                  if (pollingRef.current.shouldContinue) {
                    fetchFiles(false);
                  }
                }, 3000);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch files:", err);
      } finally {
        setLoadingFiles(false);
      }
    };

    // Initial fetch
    fetchFiles(true);

    // Poll for updates every 3 seconds
    pollingRef.current.intervalId = setInterval(() => {
      if (pollingRef.current.shouldContinue) {
        fetchFiles(false);
      }
    }, 3000);

    return () => {
      pollingRef.current.shouldContinue = false;
      if (pollingRef.current.intervalId) {
        clearInterval(pollingRef.current.intervalId);
        pollingRef.current.intervalId = null;
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      trackEvent("upload_initiated");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();

      // The server already sets the cookie in the response, but we'll also update it client-side
      // to ensure it's immediately available for the next request
      const cookieValue = document.cookie
        .split("; ")
        .find((row) => row.startsWith("uploaded_file_ids="));
      let existingIds: string[] = [];
      
      try {
        if (cookieValue) {
          const cookiePart = cookieValue.split("=").slice(1).join("="); // Handle cases where = is in the value
          existingIds = JSON.parse(decodeURIComponent(cookiePart));
        }
      } catch (e) {
        console.warn("Failed to parse existing cookie, starting fresh:", e);
        existingIds = [];
      }
      
      if (!existingIds.includes(data.jobId)) {
        existingIds.push(data.jobId);
        const recentIds = existingIds.slice(-50);
        // URL encode the cookie value
        const encodedValue = encodeURIComponent(JSON.stringify(recentIds));
        document.cookie = `uploaded_file_ids=${encodedValue}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      }

      // Track completion
      trackEvent("upload_completed", {
        file_type: file.type || "unknown",
        file_size: file.size,
      });

      // Optimistically add the new file to the list immediately
      const optimisticJob: FileJob = {
        id: data.jobId,
        userId: user?.id || "anonymous",
        filename: file.name,
        status: "uploaded",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUploadedFiles((prev) => [optimisticJob, ...prev]);

      // Reset file selection
      setFile(null);
      const fileInput = document.getElementById("upload-file") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }

      // Refresh file list immediately and restart polling if needed
      setLoadingFiles(true);
      
      // Small delay to ensure cookie is set before fetching
      setTimeout(async () => {
        const filesResponse = await fetch("/api/files");
        if (filesResponse.ok) {
          const filesData = await filesResponse.json();
          setUploadedFiles(filesData.jobs || []);
          
          // Restart polling if it was stopped (new file is processing)
          pollingRef.current.shouldContinue = true;
          if (!pollingRef.current.intervalId) {
            pollingRef.current.intervalId = setInterval(async () => {
              if (pollingRef.current.shouldContinue) {
                const response = await fetch("/api/files");
                if (response.ok) {
                  const data = await response.json();
                  setUploadedFiles(data.jobs || []);
                  
                  // Check if we should stop polling
                  if (data.jobs.length > 0) {
                    const allFinished = data.jobs.every(
                      (job: FileJob) => job.status === "completed" || job.status === "failed"
                    );
                    if (allFinished) {
                      pollingRef.current.shouldContinue = false;
                      if (pollingRef.current.intervalId) {
                        clearInterval(pollingRef.current.intervalId);
                        pollingRef.current.intervalId = null;
                      }
                    }
                  }
                }
              }
            }, 3000);
          }
        }
        setLoadingFiles(false);
      }, 100);

      setUploading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  };

  return (
    <section
      id="upload"
      ref={sectionRef}
      className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50"
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Upload a statement
          </h2>
          <p className="text-lg text-gray-600">
            Upload directly if you&apos;re comfortable. Redacted files are OK.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          {!file ? (
            <div className="space-y-4">
              <input
                id="upload-file"
                type="file"
                accept=".pdf,.xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <label
                htmlFor="upload-file"
                className="flex flex-col items-center justify-center w-full py-12 px-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
              >
                <svg
                  className="w-12 h-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-lg font-medium text-gray-700 mb-2">
                  Click to upload statement
                </span>
                <span className="text-sm text-gray-500">
                  PDF, Excel, or CSV files
                </span>
              </label>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <svg
                    className="w-8 h-8 text-blue-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    "Confirm & Process"
                  )}
                </button>
                <button
                  onClick={() => {
                    setFile(null);
                    setError(null);
                    const fileInput = document.getElementById(
                      "upload-file"
                    ) as HTMLInputElement;
                    if (fileInput) {
                      fileInput.value = "";
                    }
                  }}
                  disabled={uploading}
                  className="px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                >
                  Re-upload
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Uploaded Files List */}
        {(loadingFiles || uploadedFiles.length > 0) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Uploaded Files
            </h3>
            {loadingFiles ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading files...</p>
              </div>
            ) : uploadedFiles.length > 0 ? (
              <div className="space-y-3">
                {uploadedFiles.map((job) => (
                  <FileItem key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No files uploaded yet.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function FileItem({ job }: { job: FileJob }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Link
      href={`/status/${job.id}`}
      className="block bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-gray-900 truncate">
              {job.filename}
            </p>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                job.status
              )}`}
            >
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Uploaded: {formatDate(job.createdAt)}
          </p>
          {job.error && (
            <p className="text-xs text-red-600 mt-1 truncate">
              Error: {job.error}
            </p>
          )}
        </div>
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}

