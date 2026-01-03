"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

export default function SampleExcelSection() {
  const [email, setEmail] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDownloading(true);

    try {
      // Track the event
      trackEvent("sample_excel_request", {
        email: email || "not_provided",
      });

      // Download the sample Excel file
      const response = await fetch("/sample-statement-output.xlsx");
      if (!response.ok) {
        throw new Error("Failed to download sample file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sample-statement-output.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Reset form
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download sample");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            See a sample analysis-ready Excel
          </h2>
          <p className="text-lg text-gray-600">
            Get a preview of the standardized output format
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-gray-200 p-8">
          <form onSubmit={handleDownload} className="space-y-6">
            <div>
              <label
                htmlFor="sample-email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email (optional)
              </label>
              <input
                id="sample-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                We&apos;ll send you updates about new features (optional)
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={downloading}
              className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {downloading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Downloading...
                </>
              ) : (
                "Get sample Excel"
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

