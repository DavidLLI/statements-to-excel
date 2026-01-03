"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { trackEvent } from "@/lib/analytics";
import SampleExcelSection from "@/components/SampleExcelSection";
import UploadSection from "@/components/UploadSection";

export default function LandingPage() {
  const { user, isLoaded } = useUser();
  const [migrationCompleted, setMigrationCompleted] = useState(false);
  
  // Contact form state
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // Update email when user loads
  useEffect(() => {
    if (isLoaded && user) {
      setEmail(user.emailAddresses[0]?.emailAddress || "");
    }
  }, [isLoaded, user]);

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

        const cookieJobIds = JSON.parse(decodeURIComponent(cookieValue.split("=")[1] || "[]"));

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

  const handleScrollToUpload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    trackEvent("helper_scroll_to_upload");
    const uploadSection = document.getElementById("upload");
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSampleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    trackEvent("sample_excel_request", {
      source: "hero_cta",
    });
    const sampleSection = document.getElementById("sample");
    if (sampleSection) {
      sampleSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Turn Investment Statements into Analysis-Ready Excel
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-4 leading-relaxed">
              Standardize holdings, transactions, and cashflows — without manual Excel work.
            </p>
            <p className="text-lg text-gray-500 mb-10">
              Built for family offices, wealth managers, and serious investors.
            </p>

            {/* Primary CTA */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <a
                href="#sample"
                onClick={handleSampleClick}
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-lg"
              >
                See a sample Excel output
              </a>

              {/* Helper CTA */}
              <a
                href="#upload"
                onClick={handleScrollToUpload}
                className="inline-flex items-center text-base font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Upload a statement now →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">
            Why investment reporting is still painful
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4 p-6 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-lg text-gray-700">Inconsistent statement formats</p>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-lg text-gray-700">Non-standard holdings and transactions</p>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-lg text-gray-700">Hours lost cleaning Excel</p>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-lg text-gray-700">Manual errors during consolidation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Output Preview Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">
            What you get
          </h2>

          {/* Side-by-side layout - mobile friendly */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Holdings */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 text-center">Holdings</h3>
              </div>
              <div className="p-4">
                <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src="/holdings-sample.png"
                    alt="Sample Excel output - Holdings"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 text-center">Transactions</h3>
              </div>
              <div className="p-4">
                <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src="/transactions-sample.png"
                    alt="Sample Excel output - Transactions"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Cashflows */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 text-center">Cashflows</h3>
              </div>
              <div className="p-4">
                <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src="/cashflow-sample.png"
                    alt="Sample Excel output - Cashflows"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">
            Data security & privacy
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4 p-6 bg-green-50 rounded-lg border border-green-100">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 mb-1">Files processed temporarily</p>
                <p className="text-sm text-gray-600">No long-term storage</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-green-50 rounded-lg border border-green-100">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 mb-1">Deleted after export</p>
                <p className="text-sm text-gray-600">Your data is removed immediately</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-green-50 rounded-lg border border-green-100 md:col-span-2">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 mb-1">Never used for training</p>
                <p className="text-sm text-gray-600">Your data is never used to train AI models</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Excel Section */}
      <section id="sample" className="scroll-mt-20">
        <SampleExcelSection />
      </section>

      {/* Upload Section */}
      <UploadSection />

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
                  <a
                    href="#upload"
                    onClick={(e) => {
                      e.preventDefault();
                      const uploadSection = document.getElementById("upload");
                      if (uploadSection) {
                        uploadSection.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Upload Statement
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    onClick={(e) => {
                      e.preventDefault();
                      const contactSection = document.getElementById("contact");
                      if (contactSection) {
                        contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className="hover:text-white transition-colors"
                  >
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
