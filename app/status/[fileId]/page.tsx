// Status page showing processing status and results

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { FileJob, ExtractionResult } from "@/types";
import SignInModal from "@/components/SignInModal";

export default function StatusPage() {
  const params = useParams();
  const fileId = params.fileId as string;
  const [job, setJob] = useState<FileJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"holdings" | "transactions" | "cashMovements">("holdings");
  const { user, isLoaded } = useUser();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  // Show full data by default if user is logged in, preview if not
  const [showPreview, setShowPreview] = useState(true);

  // Update preview state when user authentication status changes
  useEffect(() => {
    if (isLoaded && user) {
      setShowPreview(false);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (!fileId) return;

    let intervalId: NodeJS.Timeout | null = null;
    let shouldContinuePolling = true;

    const fetchStatus = async () => {
      if (!shouldContinuePolling) return;

      try {
        const response = await fetch(`/api/status/${fileId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch status");
        }
        const data = await response.json();
        setJob(data);
        setLoading(false);

        // Stop polling if completed or failed
        if (data.status === "completed" || data.status === "failed") {
          shouldContinuePolling = false;
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch (error) {
        console.error("Status fetch error:", error);
        setLoading(false);
        // Don't stop polling on error, keep trying
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 3 seconds
    intervalId = setInterval(() => {
      if (shouldContinuePolling) {
        fetchStatus();
      }
    }, 3000);

    return () => {
      shouldContinuePolling = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fileId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">File job not found</p>
        </div>
      </div>
    );
  }

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

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white shadow rounded-lg p-4 sm:p-8">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Processing Status
                </h1>
                <p className="text-sm sm:text-base text-gray-600 break-words">File: {job.filename}</p>
              </div>
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap"
              >
                ← Upload Another File
              </Link>
            </div>
            <div className="inline-block">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  job.status
                )}`}
              >
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
            </div>
            {job.error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                Error: {job.error}
              </div>
            )}
          </div>

          {job.status === "completed" && job.result && (
            <div>
              {/* Download buttons */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="mb-4 sm:mb-0 sm:flex sm:items-center sm:justify-between">
                  <div className="mb-3 sm:mb-0">
                    <h3 className="text-sm font-medium text-blue-900 mb-1">
                      {isLoaded && user ? "Full Data" : showPreview ? "Preview Mode" : "Full Data"}
                    </h3>
                    <p className="text-xs text-blue-700">
                      {isLoaded && user
                        ? "Showing all data. Download full Excel file."
                        : showPreview
                        ? "Showing first 5 rows of each table. Download preview Excel or sign in for full version."
                        : "Showing all data. Download full Excel file."}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {/* Only show preview download button if user is not logged in */}
                    {(!isLoaded || !user) && (
                      <button
                        onClick={() => {
                          const url = `/api/download/${fileId}?type=preview`;
                          window.open(url, "_blank");
                        }}
                        className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 text-sm font-medium"
                      >
                        Download Preview Excel
                      </button>
                    )}
                    {isLoaded && user ? (
                      <button
                        onClick={() => {
                          const url = `/api/download/${fileId}?type=full`;
                          window.open(url, "_blank");
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                      >
                        Download Full Excel
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsSignInModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                      >
                        Sign In for Full Excel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Toggle preview/full - only show if user is not logged in */}
              {(!isLoaded || !user) && (
                <div className="mb-4 flex items-center gap-2 overflow-x-auto">
                  <button
                    onClick={() => setShowPreview(true)}
                    className={`px-3 py-2 text-xs sm:text-sm rounded whitespace-nowrap ${
                      showPreview
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Preview (5 rows)
                  </button>
                  <button
                    onClick={() => {
                      if (isLoaded && user) {
                        setShowPreview(false);
                      } else {
                        setIsSignInModalOpen(true);
                      }
                    }}
                    className={`px-3 py-2 text-xs sm:text-sm rounded whitespace-nowrap ${
                      !showPreview
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Full Data {!isLoaded || !user ? "(Sign In)" : ""}
                  </button>
                </div>
              )}

              <div className="border-b border-gray-200 mb-6 overflow-x-auto">
                <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
                  {(["holdings", "transactions", "cashMovements"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`${
                        activeTab === tab
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      {tab === "holdings"
                        ? "Holdings"
                        : tab === "transactions"
                        ? "Transactions"
                        : "Cash Movements"}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="overflow-x-auto">
                {activeTab === "holdings" && (
                  <HoldingsTable
                    holdings={job.result.holdings}
                    preview={isLoaded && user ? false : showPreview}
                    isAuthenticated={isLoaded && !!user}
                  />
                )}
                {activeTab === "transactions" && (
                  <TransactionsTable
                    transactions={job.result.transactions}
                    preview={isLoaded && user ? false : showPreview}
                    isAuthenticated={isLoaded && !!user}
                  />
                )}
                {activeTab === "cashMovements" && (
                  <CashMovementsTable
                    cashMovements={job.result.cashMovements}
                    preview={isLoaded && user ? false : showPreview}
                    isAuthenticated={isLoaded && !!user}
                  />
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </>
  );
}

function HoldingsTable({
  holdings,
  preview = false,
  isAuthenticated = false,
}: {
  holdings: ExtractionResult["holdings"];
  preview?: boolean;
  isAuthenticated?: boolean;
}) {
  if (holdings.length === 0) {
    return <p className="text-gray-500">No holdings data found.</p>;
  }

  const displayHoldings = preview ? holdings.slice(0, 5) : holdings;
  const totalCount = holdings.length;
  const showingCount = displayHoldings.length;

  return (
    <div>
      {!isAuthenticated && preview && totalCount > 5 && (
        <div className="mb-3 text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2">
          Showing {showingCount} of {totalCount} holdings. Sign in to view all data.
        </div>
      )}
      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asset Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asset Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Currency
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Market Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                As of Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayHoldings.map((holding, idx) => (
              <tr key={idx}>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {holding.asset_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {holding.asset_type}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {holding.quantity !== null ? holding.quantity.toLocaleString() : "N/A"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {holding.unit_price !== null && holding.unit_price !== undefined
                    ? `${holding.currency} ${holding.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "N/A"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {holding.currency}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {holding.market_value !== null
                    ? `${holding.currency} ${holding.market_value.toLocaleString()}`
                    : "N/A"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {holding.as_of_date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {displayHoldings.map((holding, idx) => (
          <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-gray-500">Asset Name</span>
                <p className="text-sm font-semibold text-gray-900">{holding.asset_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs font-medium text-gray-500">Type</span>
                  <p className="text-sm text-gray-700">{holding.asset_type}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Quantity</span>
                  <p className="text-sm text-gray-700">{holding.quantity !== null ? holding.quantity.toLocaleString() : "N/A"}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Unit Price</span>
                  <p className="text-sm text-gray-700">
                    {holding.unit_price !== null && holding.unit_price !== undefined
                      ? `${holding.currency} ${holding.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Currency</span>
                  <p className="text-sm text-gray-700">{holding.currency}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Market Value</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {holding.market_value !== null
                      ? `${holding.currency} ${holding.market_value.toLocaleString()}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">As of Date</span>
                  <p className="text-sm text-gray-700">{holding.as_of_date}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionsTable({
  transactions,
  preview = false,
  isAuthenticated = false,
}: {
  transactions: ExtractionResult["transactions"];
  preview?: boolean;
  isAuthenticated?: boolean;
}) {
  if (transactions.length === 0) {
    return <p className="text-gray-500">No transactions data found.</p>;
  }

  const displayTransactions = preview ? transactions.slice(0, 5) : transactions;
  const totalCount = transactions.length;
  const showingCount = displayTransactions.length;

  return (
    <div>
      {!isAuthenticated && preview && totalCount > 5 && (
        <div className="mb-3 text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2">
          Showing {showingCount} of {totalCount} transactions. Sign in to view all data.
        </div>
      )}
      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asset Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Currency
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayTransactions.map((transaction, idx) => (
              <tr key={idx}>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {transaction.date}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {transaction.asset_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {transaction.transaction_type}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {transaction.quantity !== null ? transaction.quantity.toLocaleString() : "N/A"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {transaction.price !== null ? transaction.price.toLocaleString() : "N/A"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {transaction.amount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {transaction.currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {displayTransactions.map((transaction, idx) => (
          <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-gray-500">Date</span>
                <p className="text-sm font-semibold text-gray-900">{transaction.date}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500">Asset Name</span>
                <p className="text-sm text-gray-700">{transaction.asset_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs font-medium text-gray-500">Type</span>
                  <p className="text-sm text-gray-700">{transaction.transaction_type}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Quantity</span>
                  <p className="text-sm text-gray-700">{transaction.quantity !== null ? transaction.quantity.toLocaleString() : "N/A"}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Price</span>
                  <p className="text-sm text-gray-700">{transaction.price !== null ? transaction.price.toLocaleString() : "N/A"}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Currency</span>
                  <p className="text-sm text-gray-700">{transaction.currency}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-medium text-gray-500">Amount</span>
                  <p className="text-sm font-semibold text-gray-900">{transaction.amount.toLocaleString()} {transaction.currency}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CashMovementsTable({
  cashMovements,
  preview = false,
  isAuthenticated = false,
}: {
  cashMovements: ExtractionResult["cashMovements"];
  preview?: boolean;
  isAuthenticated?: boolean;
}) {
  if (cashMovements.length === 0) {
    return <p className="text-gray-500">No cash movements data found.</p>;
  }

  // Ensure all cash movements have running_balance (for backward compatibility)
  const normalizedCashMovements = cashMovements.map((cm, idx) => {
    if (cm.running_balance === undefined || cm.running_balance === null) {
      // Calculate running balance from previous movements
      const previousMovements = cashMovements.slice(0, idx);
      const runningBalance = previousMovements.reduce((sum, m) => sum + (m.amount || 0), 0) + (cm.amount || 0);
      return { ...cm, running_balance: runningBalance };
    }
    return cm;
  });

  const displayCashMovements = preview ? normalizedCashMovements.slice(0, 5) : normalizedCashMovements;
  const totalCount = cashMovements.length;
  const showingCount = displayCashMovements.length;

  return (
    <div>
      {!isAuthenticated && preview && totalCount > 5 && (
        <div className="mb-3 text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2">
          Showing {showingCount} of {totalCount} cash movements. Sign in to view all data.
        </div>
      )}
      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Currency
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Running Balance
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayCashMovements.map((movement, idx) => (
              <tr key={idx}>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {movement.date}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {movement.type}
                </td>
                <td className={`px-4 py-3 text-sm font-medium ${
                  movement.amount >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {movement.amount >= 0 ? "+" : ""}{movement.currency} {Math.abs(movement.amount).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {movement.currency}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                  {movement.running_balance !== undefined && movement.running_balance !== null
                    ? `${movement.currency} ${movement.running_balance.toFixed(2)}`
                    : "N/A"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {movement.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {displayCashMovements.map((movement, idx) => (
          <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-500">Date</span>
                  <p className="text-sm font-semibold text-gray-900">{movement.date}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-gray-500">Type</span>
                  <p className="text-sm text-gray-700">{movement.type}</p>
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500">Amount</span>
                <p className={`text-lg font-semibold ${
                  movement.amount >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {movement.amount >= 0 ? "+" : ""}{movement.currency} {Math.abs(movement.amount).toLocaleString()}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs font-medium text-gray-500">Currency</span>
                  <p className="text-sm text-gray-700">{movement.currency}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Running Balance</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {movement.running_balance !== undefined && movement.running_balance !== null
                      ? `${movement.currency} ${movement.running_balance.toFixed(2)}`
                      : "N/A"}
                  </p>
                </div>
              </div>
              {movement.description && (
                <div>
                  <span className="text-xs font-medium text-gray-500">Description</span>
                  <p className="text-sm text-gray-700">{movement.description}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

