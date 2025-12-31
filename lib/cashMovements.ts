// Calculate cash movements from transactions with running balance

import { Transaction, CashMovement } from "@/types";

export function calculateCashMovements(transactions: Transaction[]): CashMovement[] {
  // Sort transactions by date
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const cashMovements: CashMovement[] = [];
  let runningBalance = 0;

  for (const transaction of sortedTransactions) {
    let cashAmount = 0;
    let movementType: CashMovement["type"] = "Other";
    let description = "";

    switch (transaction.transaction_type) {
      case "Buy":
        cashAmount = -Math.abs(transaction.amount); // Cash out
        movementType = "Withdrawal";
        description = `Purchase ${transaction.asset_name}`;
        break;
      case "Sell":
        cashAmount = Math.abs(transaction.amount); // Cash in
        movementType = "Deposit";
        description = `Sale of ${transaction.asset_name}`;
        break;
      case "Dividend":
        cashAmount = Math.abs(transaction.amount); // Cash in
        movementType = "Distribution";
        description = `Dividend from ${transaction.asset_name}`;
        break;
      case "Interest":
        cashAmount = Math.abs(transaction.amount); // Cash in
        movementType = "Interest";
        description = `Interest from ${transaction.asset_name}`;
        break;
      case "Fee":
        cashAmount = -Math.abs(transaction.amount); // Cash out
        movementType = "Other";
        description = `Fee: ${transaction.asset_name}`;
        break;
      default:
        // For "Other" transactions, use amount as-is (positive = cash in, negative = cash out)
        cashAmount = transaction.amount;
        movementType = transaction.amount >= 0 ? "Deposit" : "Withdrawal";
        description = `${transaction.transaction_type}: ${transaction.asset_name}`;
    }

    runningBalance += cashAmount;

    cashMovements.push({
      date: transaction.date,
      type: movementType,
      amount: cashAmount,
      currency: transaction.currency,
      running_balance: runningBalance,
      description: description,
    });
  }

  return cashMovements;
}

