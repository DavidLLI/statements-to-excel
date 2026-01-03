// Script to generate a sample Excel file for demonstration
// Usage: npx tsx scripts/generate-sample-excel.ts

import { generateExcel } from "../lib/excelExport";
import { ExtractionResult } from "../types";
import * as fs from "fs";
import * as path from "path";

// Generate sample data
const sampleData: ExtractionResult = {
  holdings: [
    {
      asset_name: "Apple Inc.",
      asset_type: "Equity",
      quantity: 100,
      unit_price: 175.50,
      currency: "USD",
      market_value: 17550.00,
      as_of_date: "2024-12-31",
    },
    {
      asset_name: "Microsoft Corporation",
      asset_type: "Equity",
      quantity: 50,
      unit_price: 380.25,
      currency: "USD",
      market_value: 19012.50,
      as_of_date: "2024-12-31",
    },
    {
      asset_name: "Amazon.com Inc.",
      asset_type: "Equity",
      quantity: 75,
      unit_price: 152.30,
      currency: "USD",
      market_value: 11422.50,
      as_of_date: "2024-12-31",
    },
    {
      asset_name: "Vanguard S&P 500 ETF",
      asset_type: "Fund",
      quantity: 200,
      unit_price: 425.80,
      currency: "USD",
      market_value: 85160.00,
      as_of_date: "2024-12-31",
    },
    {
      asset_name: "Tesla Inc.",
      asset_type: "Equity",
      quantity: 25,
      unit_price: 248.90,
      currency: "USD",
      market_value: 6222.50,
      as_of_date: "2024-12-31",
    },
    {
      asset_name: "Alphabet Inc. Class A",
      asset_type: "Equity",
      quantity: 30,
      unit_price: 142.50,
      currency: "USD",
      market_value: 4275.00,
      as_of_date: "2024-12-31",
    },
    {
      asset_name: "NVIDIA Corporation",
      asset_type: "Equity",
      quantity: 40,
      unit_price: 495.20,
      currency: "USD",
      market_value: 19808.00,
      as_of_date: "2024-12-31",
    },
    {
      asset_name: "Meta Platforms Inc.",
      asset_type: "Equity",
      quantity: 60,
      unit_price: 485.75,
      currency: "USD",
      market_value: 29145.00,
      as_of_date: "2024-12-31",
    },
  ],
  transactions: [
    {
      date: "2024-01-15",
      asset_name: "Apple Inc.",
      transaction_type: "Buy",
      quantity: 100,
      price: 185.20,
      amount: 18520.00,
      currency: "USD",
    },
    {
      date: "2024-02-10",
      asset_name: "Microsoft Corporation",
      transaction_type: "Buy",
      quantity: 50,
      price: 395.50,
      amount: 19775.00,
      currency: "USD",
    },
    {
      date: "2024-03-05",
      asset_name: "Amazon.com Inc.",
      transaction_type: "Buy",
      quantity: 75,
      price: 178.90,
      amount: 13417.50,
      currency: "USD",
    },
    {
      date: "2024-04-12",
      asset_name: "Vanguard S&P 500 ETF",
      transaction_type: "Buy",
      quantity: 200,
      price: 410.25,
      amount: 82050.00,
      currency: "USD",
    },
    {
      date: "2024-05-20",
      asset_name: "Tesla Inc.",
      transaction_type: "Buy",
      quantity: 25,
      price: 265.30,
      amount: 6632.50,
      currency: "USD",
    },
    {
      date: "2024-06-08",
      asset_name: "Alphabet Inc. Class A",
      transaction_type: "Buy",
      quantity: 30,
      price: 155.80,
      amount: 4674.00,
      currency: "USD",
    },
    {
      date: "2024-07-15",
      asset_name: "NVIDIA Corporation",
      transaction_type: "Buy",
      quantity: 40,
      price: 520.00,
      amount: 20800.00,
      currency: "USD",
    },
    {
      date: "2024-08-22",
      asset_name: "Meta Platforms Inc.",
      transaction_type: "Buy",
      quantity: 60,
      price: 475.50,
      amount: 28530.00,
      currency: "USD",
    },
    {
      date: "2024-09-10",
      asset_name: "Apple Inc.",
      transaction_type: "Dividend",
      quantity: null,
      price: null,
      amount: 240.00,
      currency: "USD",
    },
    {
      date: "2024-10-05",
      asset_name: "Microsoft Corporation",
      transaction_type: "Dividend",
      quantity: null,
      price: null,
      amount: 140.00,
      currency: "USD",
    },
    {
      date: "2024-11-18",
      asset_name: "Vanguard S&P 500 ETF",
      transaction_type: "Dividend",
      quantity: null,
      price: null,
      amount: 320.00,
      currency: "USD",
    },
  ],
  cashMovements: [
    {
      date: "2024-01-15",
      type: "Deposit",
      amount: 50000.00,
      currency: "USD",
      running_balance: 50000.00,
      description: "Initial deposit",
    },
    {
      date: "2024-01-15",
      type: "Withdrawal",
      amount: -18520.00,
      currency: "USD",
      running_balance: 31480.00,
      description: "Purchase of Apple Inc. shares",
    },
    {
      date: "2024-02-10",
      type: "Withdrawal",
      amount: -19775.00,
      currency: "USD",
      running_balance: 11705.00,
      description: "Purchase of Microsoft Corporation shares",
    },
    {
      date: "2024-02-20",
      type: "Deposit",
      amount: 20000.00,
      currency: "USD",
      running_balance: 31705.00,
      description: "Additional deposit",
    },
    {
      date: "2024-03-05",
      type: "Withdrawal",
      amount: -13417.50,
      currency: "USD",
      running_balance: 18287.50,
      description: "Purchase of Amazon.com Inc. shares",
    },
    {
      date: "2024-04-12",
      type: "Withdrawal",
      amount: -82050.00,
      currency: "USD",
      running_balance: -63762.50,
      description: "Purchase of Vanguard S&P 500 ETF shares",
    },
    {
      date: "2024-04-25",
      type: "Deposit",
      amount: 100000.00,
      currency: "USD",
      running_balance: 36237.50,
      description: "Large deposit",
    },
    {
      date: "2024-05-20",
      type: "Withdrawal",
      amount: -6632.50,
      currency: "USD",
      running_balance: 29605.00,
      description: "Purchase of Tesla Inc. shares",
    },
    {
      date: "2024-06-08",
      type: "Withdrawal",
      amount: -4674.00,
      currency: "USD",
      running_balance: 24931.00,
      description: "Purchase of Alphabet Inc. Class A shares",
    },
    {
      date: "2024-07-15",
      type: "Withdrawal",
      amount: -20800.00,
      currency: "USD",
      running_balance: 4131.00,
      description: "Purchase of NVIDIA Corporation shares",
    },
    {
      date: "2024-08-22",
      type: "Withdrawal",
      amount: -28530.00,
      currency: "USD",
      running_balance: -24399.00,
      description: "Purchase of Meta Platforms Inc. shares",
    },
    {
      date: "2024-08-30",
      type: "Deposit",
      amount: 50000.00,
      currency: "USD",
      running_balance: 25601.00,
      description: "Final deposit",
    },
    {
      date: "2024-09-10",
      type: "Distribution",
      amount: 240.00,
      currency: "USD",
      running_balance: 25841.00,
      description: "Dividend from Apple Inc.",
    },
    {
      date: "2024-10-05",
      type: "Distribution",
      amount: 140.00,
      currency: "USD",
      running_balance: 25981.00,
      description: "Dividend from Microsoft Corporation",
    },
    {
      date: "2024-11-18",
      type: "Distribution",
      amount: 320.00,
      currency: "USD",
      running_balance: 26301.00,
      description: "Dividend from Vanguard S&P 500 ETF",
    },
  ],
};

async function generateSample() {
  try {
    console.log("Generating sample Excel file...");
    
    // Generate full version (not preview)
    const buffer = generateExcel(sampleData, false);
    
    // Ensure assets directory exists
    const assetsDir = path.join(process.cwd(), "assets");
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Write to file
    const outputPath = path.join(assetsDir, "sample-statement-output.xlsx");
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`✅ Sample Excel file generated successfully!`);
    console.log(`📁 Location: ${outputPath}`);
    console.log(`\n📊 File contains:`);
    console.log(`   - ${sampleData.holdings.length} holdings`);
    console.log(`   - ${sampleData.transactions.length} transactions`);
    console.log(`   - ${sampleData.cashMovements.length} cash movements`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to generate sample Excel file:", error);
    process.exit(1);
  }
}

generateSample();

