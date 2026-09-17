/**
 * Budget Tracker Type Definitions
 *
 * Core types for shared expense management, split calculations,
 * and settle-up summaries.
 */

/**
 * Expense entry with payer, amount in cents, category, and split data
 */
export type BudgetEntry = {
  id: string;
  trip_id: string;
  paid_by: string; // user_id
  amount_cents: number; // Always stored as cents, never floats
  description: string;
  category: 'food' | 'supplies' | 'fuel' | 'activity' | 'misc';
  split_type: 'equal' | 'custom';
  split_with: string[] | null; // user_ids participating in split
  custom_splits: Record<string, number> | null; // {user_id: amount_cents}
  receipt_url?: string | null;
  created_at: string;
};

/**
 * Split breakdown for a single expense
 */
export type ExpenseSplit = {
  user_id: string;
  amount_cents: number;
  percentage?: number; // for display
};

/**
 * Settlement calculation: who owes whom
 */
export type Settlement = {
  from_user_id: string;
  to_user_id: string;
  amount_cents: number;
};

/**
 * Per-member balance summary
 */
export type MemberBalance = {
  user_id: string;
  total_paid_cents: number; // amount this person paid
  total_owed_cents: number; // amount this person owes
  net_balance_cents: number; // positive = owed money, negative = owes money
};

/**
 * Ledger summary for a trip
 */
export type BudgetSummary = {
  trip_id: string;
  total_expenses_cents: number;
  member_balances: Map<string, MemberBalance>;
  settlements: Settlement[];
};

/**
 * Form state for creating/editing an expense
 */
export type ExpenseFormData = {
  description: string;
  amount_cents: number;
  category: 'food' | 'supplies' | 'fuel' | 'activity' | 'misc';
  split_type: 'equal' | 'custom';
  split_with: Set<string>; // user_ids to split with
  custom_splits?: Map<string, number>; // {user_id: amount_cents}
  receipt_url?: string | null;
};

/**
 * UI state for split calculator
 */
export type SplitInput = {
  [user_id: string]: number; // amount in cents
};
