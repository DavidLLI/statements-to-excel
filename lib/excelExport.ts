// Excel export utility for generating preview and full versions

import * as XLSX from "xlsx";
import { ExtractionResult } from "@/types";

export function generateExcel(result: ExtractionResult, preview: boolean = false): Buffer {
  const workbook = XLSX.utils.book_new();

  // Prepare data - limit to 5 rows for preview
  const holdings = preview ? result.holdings.slice(0, 5) : result.holdings;
  const transactions = preview ? result.transactions.slice(0, 5) : result.transactions;
  const cashMovements = preview ? result.cashMovements.slice(0, 5) : result.cashMovements;

  // Holdings sheet
  if (holdings.length > 0) {
    const holdingsData = holdings.map((h) => ({
      "Asset Name": h.asset_name,
      "Asset Type": h.asset_type,
      Quantity: h.quantity,
      "Unit Price": h.unit_price,
      Currency: h.currency,
      "Market Value": h.market_value,
      "As of Date": h.as_of_date,
    }));
    const holdingsSheet = XLSX.utils.json_to_sheet(holdingsData);
    XLSX.utils.book_append_sheet(workbook, holdingsSheet, "Holdings");
  }

  // Transactions sheet
  if (transactions.length > 0) {
    const transactionsData = transactions.map((t) => ({
      Date: t.date,
      "Asset Name": t.asset_name,
      "Transaction Type": t.transaction_type,
      Quantity: t.quantity,
      Price: t.price,
      Amount: t.amount,
      Currency: t.currency,
    }));
    const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, "Transactions");
  }

  // Cash Movements sheet
  if (cashMovements.length > 0) {
    const cashMovementsData = cashMovements.map((cm) => ({
      Date: cm.date,
      Type: cm.type,
      Amount: cm.amount,
      Currency: cm.currency,
      "Running Balance": cm.running_balance !== undefined && cm.running_balance !== null
        ? `${cm.currency} ${cm.running_balance.toFixed(2)}`
        : "N/A",
      Description: cm.description,
    }));
    const cashMovementsSheet = XLSX.utils.json_to_sheet(cashMovementsData);
    XLSX.utils.book_append_sheet(workbook, cashMovementsSheet, "Cash Movements");
  }

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}

