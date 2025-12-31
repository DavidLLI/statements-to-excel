// Landing page for Hawk Wallet - Combined with upload and contact

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { FileJob } from "@/types";

export default function LandingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileJob[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [migrationCompleted, setMigrationCompleted] = useState(false);

  // Contact form state
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // Migrate anonymous files to user account when user logs in
  useEffect(() => {
    const migrateFiles = async () => {
      if (!isLoaded || !user || migrationCompleted) {
        return;
      }

      try {
        const cookieValue = document.cookie
          .split("; ")
          .find((row) => row.startsWith("uploaded_file_ids="));

        if (!cookieValue) {
          setMigrationCompleted(true);
          return;
        }

        const cookieJobIds = JSON.parse(cookieValue.split("=")[1] || "[]");

        if (cookieJobIds.length === 0) {
          setMigrationCompleted(true);
          return;
        }

        const response = await fetch("/api/migrate-files", {
          method: "POST",
        });

        if (response.ok) {
          const data = await response.json();
          setMigrationCompleted(true);

          const filesResponse = await fetch("/api/files");
          if (filesResponse.ok) {
            const filesData = await filesResponse.json();
            setUploadedFiles(filesData.jobs || []);
          }

          if (data.transferredCount > 0) {
            console.log(`Transferred ${data.transferredCount} file(s) to your account`);
          }
        }
      } catch (error) {
        console.error("Migration error:", error);
        setMigrationCompleted(true);
      }
    };

    migrateFiles();
  }, [user, isLoaded, migrationCompleted]);

  // Fetch uploaded files on mount and periodically
  useEffect(() => {
    const fetchFiles = async (showLoading = false) => {
      if (showLoading) {
        setLoadingFiles(true);
      }
      try {
        const response = await fetch("/api/files");
        if (response.ok) {
          const data = await response.json();
          setUploadedFiles(data.jobs || []);
        }
      } catch (err) {
        console.error("Failed to fetch files:", err);
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchFiles(true);

    const interval = setInterval(() => {
      fetchFiles(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Update email when user loads
  useEffect(() => {
    if (isLoaded && user) {
      setEmail(user.emailAddresses[0]?.emailAddress || "");
    }
  }, [isLoaded, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
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

      // Reset file selection
      setFile(null);
      const fileInput = document.getElementById("file") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }

      // Refresh file list to show the new upload
      setLoadingFiles(true);
      const filesResponse = await fetch("/api/files");
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        setUploadedFiles(filesData.jobs || []);
      }
      setLoadingFiles(false);
      
      setUploading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setContactError(null);

    try {
      const response = await fetch("https://formspree.io/f/mqekrlza", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setSubmitted(true);
      setMessage("");
    } catch (err) {
      setContactError(err instanceof Error ? err.message : "Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Upload & View Files Section - At the Top */}
      <section id="upload" className="bg-gradient-to-br from-blue-50 via-white to-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Upload Investment Statement
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Upload a PDF, Excel, or CSV file to extract financial data
            </p>
            {!user && (
              <p className="text-sm text-gray-500">
                No sign-in required for preview. Sign in to download full Excel files.
              </p>
            )}
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 p-8 mb-8">
            {!file ? (
              // No file selected - show upload button
              <div className="space-y-4">
                <input
                  id="file"
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
                <label
                  htmlFor="file"
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
              // File selected - show file info and action buttons
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
                      // Reset file input
                      const fileInput = document.getElementById("file") as HTMLInputElement;
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
          <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Your Uploaded Files
            </h2>
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
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Turn Investment Statements into Analysis-Ready Excel
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Upload any bank or broker statement — get holdings, transactions, and cashflow movements, fully categorized and normalized, ready to model.
              </p>
            </div>

            {/* Right: Illustration */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="bg-white rounded-lg shadow-xl p-6 border-2 border-gray-200">
                  <div className="space-y-4">
                    {/* Input: Statement */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="h-2 bg-gray-300 rounded w-32 mb-1"></div>
                          <div className="h-2 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-1 bg-gray-200 rounded"></div>
                        <div className="h-1 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-1 bg-gray-200 rounded w-4/6"></div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* Output: Excel */}
                    <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="h-2 bg-green-300 rounded w-28 mb-1"></div>
                          <div className="h-2 bg-green-200 rounded w-20"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="h-3 bg-green-200 rounded"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Upload your statement
              </h3>
              <p className="text-gray-600">
                Simply upload your PDF, Excel, or CSV statement from any bank or broker.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Automatically categorize & normalize data
              </h3>
              <p className="text-gray-600">
                Our AI extracts and standardizes holdings, transactions, and cash movements.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Download analysis-ready Excel
              </h3>
              <p className="text-gray-600">
                Get a clean, structured Excel file ready for financial modeling and analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">
            Why Choose Hawk Wallet
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Save hours on manual data entry
              </h3>
              <p className="text-gray-600 text-sm">
                Automate the tedious process of extracting and organizing financial data.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Standardized, modeling-ready Excel output
              </h3>
              <p className="text-gray-600 text-sm">
                Get consistent, normalized data formats perfect for financial analysis.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Supports all major banks & brokers
              </h3>
              <p className="text-gray-600 text-sm">
                Works with statements from any financial institution, in any format.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-50 rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Contact Us
              </h2>
              <p className="text-gray-600 text-center">
                Have a question or feedback? We&apos;d love to hear from you!
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-8">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Thank You!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your feedback has been submitted successfully. We&apos;ll get back to you soon.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setMessage("");
                  }}
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="your.email@example.com"
                    disabled={submitting}
                  />
                  {isLoaded && user && (
                    <p className="mt-1 text-xs text-gray-500">
                      Pre-filled from your account
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Feedback / Questions
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={6}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Please share your feedback or questions..."
                    disabled={submitting}
                  ></textarea>
                </div>

                {contactError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {contactError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !email || !message}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Hawk Wallet</h3>
              <p className="text-sm">
                Transform investment statements into analysis-ready Excel files with AI-powered extraction.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#upload" className="hover:text-white transition-colors">
                    Upload Statement
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Hawk Wallet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
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
