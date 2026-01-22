export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum Category {
  FOOD = 'Food & Dining',
  TRANSPORT = 'Transportation',
  UTILITIES = 'Utilities',
  ENTERTAINMENT = 'Entertainment',
  SHOPPING = 'Shopping',
  HEALTH = 'Health',
  HOUSING = 'Housing',
  SALARY = 'Salary',
  INVESTMENT = 'Investment',
  OTHER = 'Other'
}

export type Payer = 'ME' | 'PARTNER';

export enum SplitType {
  SHARED = 'SHARED',       // 50/50 split
  PERSONAL = 'PERSONAL',   // Paid by X for X (no debt)
  FOR_PARTNER = 'FOR_PARTNER' // Paid by X for Y (100% debt)
}

export interface Transaction {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  merchant: string;
  amount: number;
  type: TransactionType;
  category: Category;
  payer: Payer;
  splitType: SplitType;
  notes?: string;
}

export interface FinancialSummary {
  totalPaidByMe: number;
  totalPaidByPartner: number;
  totalShared: number;
  settlementBalance: number; // Positive = Partner owes Me, Negative = I owe Partner
}

export interface ChartDataPoint {
  name: string;
  value: number;
}