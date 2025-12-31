// Test endpoint to verify Gemini API is working

import { NextResponse } from "next/server";
import { extractFinancialData } from "@/lib/gemini";

export async function GET() {
  try {
    // Check if API key is set
    const apiKey = process.env.GEMINI_API_KEY;
    const apiKeyStatus = apiKey
      ? `Set (length: ${apiKey.length}, starts with: ${apiKey.substring(0, 10)}...)`
      : "NOT SET";

    console.log("Gemini API Key Status:", apiKeyStatus);

    // Test with sample financial data
    const testContent = `
Investment Statement Sample:
Holdings as of 2024-01-15:
- Apple Inc (AAPL): 100 shares, Market Value: $18,000 USD
- Microsoft Corp (MSFT): 50 shares, Market Value: $15,000 USD

Transactions:
- 2024-01-10: Buy AAPL, 100 shares @ $180.00, Amount: $18,000 USD
- 2024-01-12: Buy MSFT, 50 shares @ $300.00, Amount: $15,000 USD

Cash Movements:
- 2024-01-05: Deposit $35,000 USD - Initial funding
- 2024-01-10: Withdrawal $18,000 USD - Purchase AAPL
- 2024-01-12: Withdrawal $15,000 USD - Purchase MSFT
`;

    console.log("Testing Gemini API...");
    const result = await extractFinancialData(testContent);
    
    return NextResponse.json({
      success: true,
      message: "Gemini API is working correctly",
      apiKeyStatus: apiKeyStatus,
      result: {
        holdingsCount: result.holdings.length,
        transactionsCount: result.transactions.length,
        cashMovementsCount: result.cashMovements.length,
        sample: {
          holdings: result.holdings.slice(0, 2),
          transactions: result.transactions.slice(0, 2),
          cashMovements: result.cashMovements.slice(0, 2),
        },
      },
    });
  } catch (error) {
    console.error("Gemini API test error:", error);
    const apiKey = process.env.GEMINI_API_KEY;
    const apiKeyStatus = apiKey
      ? `Set (length: ${apiKey.length}, starts with: ${apiKey.substring(0, 10)}...)`
      : "NOT SET";
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        apiKeyStatus: apiKeyStatus,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

