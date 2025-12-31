// Standardized output schemas

export type AssetType = "Equity" | "Fund" | "Bond" | "Private Investment" | "Cash" | "Other";

export type TransactionType = "Buy" | "Sell" | "Dividend" | "Interest" | "Fee" | "Other";

export type CashMovementType = "Deposit" | "Withdrawal" | "Distribution" | "Capital Call" | "Interest" | "Other";

export type FileJobStatus = "uploaded" | "processing" | "completed" | "failed";

export interface Holding {
  asset_name: string;
  asset_type: AssetType;
  quantity: number | null;
  currency: string;
  unit_price: number | null;
  market_value: number | null;
  as_of_date: string;
}

export interface Transaction {
  date: string;
  asset_name: string;
  transaction_type: TransactionType;
  quantity: number | null;
  price: number | null;
  amount: number;
  currency: string;
}

export interface CashMovement {
  date: string;
  type: CashMovementType;
  amount: number;
  currency: string;
  running_balance: number;
  description: string;
}

export interface ExtractionResult {
  holdings: Holding[];
  transactions: Transaction[];
  cashMovements: CashMovement[];
}

export interface FileJob {
  id: string;
  userId: string;
  filename: string;
  status: FileJobStatus;
  result?: ExtractionResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

