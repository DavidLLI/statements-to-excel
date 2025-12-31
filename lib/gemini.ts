// Gemini API integration for data extraction

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExtractionResult, Holding, Transaction, CashMovement } from "@/types";

// Lazy initialization to avoid errors at module load time
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }
  return new GoogleGenerativeAI(apiKey);
}

const SCHEMAS = `
Holdings Schema:
{
  asset_name: string
  asset_type: "Equity" | "Fund" | "Bond" | "Private Investment" | "Cash" | "Other"
  quantity: number | null
  currency: string
  unit_price: number | null (price per unit/share when available)
  market_value: number | null
  as_of_date: string (YYYY-MM-DD format)
}

Transactions Schema:
{
  date: string (YYYY-MM-DD format)
  asset_name: string
  transaction_type: "Buy" | "Sell" | "Dividend" | "Interest" | "Fee" | "Other"
  quantity: number | null
  price: number | null
  amount: number
  currency: string
}

Cash Movements Schema:
{
  date: string (YYYY-MM-DD format)
  type: "Deposit" | "Withdrawal" | "Distribution" | "Capital Call" | "Interest" | "Other"
  amount: number
  currency: string
  description: string
}
`;

const PROMPT = `You are a financial data extraction system.

Your task:
- Read the provided investment statement (PDF / Excel / CSV)
- The statement may be in English or Chinese
- Extract and normalize data into THREE datasets:
  1. Holdings (include unit_price when available)
  2. Transactions (all buy/sell/dividend/interest/fee transactions)
  3. Cash Movements (optional - will be calculated from transactions, but include if explicitly stated in document)

Rules:
- Output STRICT JSON only
- Follow the provided schemas exactly
- If a field is missing, use null
- Normalize dates to YYYY-MM-DD
- Normalize currency to ISO codes (USD, HKD, CNY, etc.)
- Infer asset types where possible
- Extract unit_price for holdings when available (price per share/unit)
- Do NOT hallucinate values
- If no data exists for a category, return an empty array

Schemas:
${SCHEMAS}

Output format (JSON only, no markdown, no code blocks):
{
  "holdings": [...],
  "transactions": [...],
  "cashMovements": [...]
}`;

export async function extractFinancialData(fileContent: string): Promise<ExtractionResult> {
  const genAI = getGenAI();
  // Use gemini-2.5-flash - best available Flash model for complex financial data extraction on free tier
  // Good balance of accuracy and speed for structured data extraction
  // Rate limits: 5 RPM, 250K TPM, 20 RPD
  // Note: gemini-3-flash may not be available yet via API, using 2.5-flash which is proven to work
  // See https://ai.google.dev/gemini-api/docs/models for available models
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const fullPrompt = `${PROMPT}\n\nInvestment Statement Content:\n${fileContent}`;

  try {
    console.log("Calling Gemini API...");
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    console.log("Gemini API response received, length:", text.length);

    // Clean up the response - remove markdown code blocks if present
    let jsonText = text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonText);

    // Validate and normalize the result
    return {
      holdings: Array.isArray(parsed.holdings)
        ? parsed.holdings.map((h: any) => ({
            ...h,
            unit_price: h.unit_price !== undefined && h.unit_price !== null ? h.unit_price : null,
            quantity: h.quantity !== undefined && h.quantity !== null ? h.quantity : null,
            market_value: h.market_value !== undefined && h.market_value !== null ? h.market_value : null,
          }))
        : [],
      transactions: Array.isArray(parsed.transactions)
        ? parsed.transactions.map((t: any) => ({
            ...t,
            quantity: t.quantity !== undefined && t.quantity !== null ? t.quantity : null,
            price: t.price !== undefined && t.price !== null ? t.price : null,
          }))
        : [],
      cashMovements: Array.isArray(parsed.cashMovements) ? parsed.cashMovements : [],
    };
  } catch (error) {
    console.error("Gemini extraction error:", error);
    console.error("Error type:", typeof error);
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Check for specific error types
    if (errorMessage.includes("API_KEY") || errorMessage.includes("401") || errorMessage.includes("403")) {
      throw new Error("Gemini API key is invalid or missing. Please check your GEMINI_API_KEY environment variable.");
    } else if (errorMessage.includes("fetch failed") || errorMessage.includes("network") || errorMessage.includes("ECONNREFUSED") || errorMessage.includes("timeout")) {
      throw new Error(`Network error connecting to Gemini API: ${errorMessage}. Please check your internet connection and API key.`);
    } else if (errorMessage.includes("quota") || errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      throw new Error("Gemini API quota exceeded. Please check your API usage limits.");
    } else if (errorMessage.includes("400") || errorMessage.includes("Bad Request")) {
      throw new Error(`Invalid request to Gemini API: ${errorMessage}. Please check your API key and request format.`);
    }
    
    throw new Error(`Failed to extract data: ${errorMessage}${errorStack ? `\nStack: ${errorStack}` : ""}`);
  }
}

