import { BudgetEntry, ExpenseSplit, MemberBalance, Settlement } from './budgetTypes';

export function calculateExpenseSplits(entry: BudgetEntry): ExpenseSplit[] {
  const participants = entry.split_with || [];
  if (entry.split_type === 'custom' && entry.custom_splits) {
    return Object.entries(entry.custom_splits).map(([userId, amountCents]) => ({
      user_id: userId,
      amount_cents: Number(amountCents),
      percentage: (Number(amountCents) / entry.amount_cents) * 100,
    }));
  }
  if (participants.length === 0) return [];
  const perPersonCents = Math.floor(entry.amount_cents / participants.length);
  const remainderCents = entry.amount_cents - perPersonCents * participants.length;
  return participants.map((userId, idx) => ({
    user_id: userId,
    amount_cents: perPersonCents + (idx === 0 ? remainderCents : 0),
    percentage: (entry.amount_cents / participants.length / entry.amount_cents) * 100,
  }));
}

export function validateExpenseInput({
  amountCents,
  splitWith,
  splitType,
  customSplits,
  currentUserId,
}: {
  amountCents: number;
  splitWith: string[];
  splitType: 'equal' | 'custom';
  customSplits?: Record<string, number>;
  currentUserId: string | null;
}): string | null {
  if (!currentUserId) return 'User not authenticated';
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return 'Amount must be a positive integer number of cents';
  }
  if (splitWith.length === 0) return 'At least one participant is required';
  if (new Set(splitWith).size !== splitWith.length) return 'Participants must be unique';
  if (!splitWith.includes(currentUserId)) return 'The payer must be included in the split';
  if (splitType !== 'custom') return null;
  if (!customSplits) return 'Custom split amounts are required';
  const participantIds = new Set(splitWith);
  let totalCents = 0;
  for (const [userId, amount] of Object.entries(customSplits)) {
    if (!participantIds.has(userId)) return 'Custom splits must use trip members';
    if (!Number.isInteger(amount) || amount < 0) {
      return 'Custom split amounts must be non-negative integer cents';
    }
    totalCents += amount;
  }
  if (totalCents !== amountCents) {
    return `Custom split total (${totalCents}¢) does not match expense amount (${amountCents}¢)`;
  }
  return null;
}

export function calculateSettleUp(
  entries: BudgetEntry[],
  memberIds: string[]
): { balances: Map<string, MemberBalance>; settlements: Settlement[] } {
  const balances = new Map<string, MemberBalance>();
  memberIds.forEach((id) => balances.set(id, {
    user_id: id,
    total_paid_cents: 0,
    total_owed_cents: 0,
    net_balance_cents: 0,
  }));

  entries.forEach((entry) => {
    const payerBalance = balances.get(entry.paid_by);
    if (payerBalance) payerBalance.total_paid_cents += entry.amount_cents;
    calculateExpenseSplits(entry).forEach((split) => {
      const balance = balances.get(split.user_id);
      if (balance) balance.total_owed_cents += split.amount_cents;
    });
  });
  balances.forEach((balance) => {
    balance.net_balance_cents = balance.total_paid_cents - balance.total_owed_cents;
  });

  const workingBalances = Array.from(balances.values()).map((balance) => ({ ...balance }));
  const settlements: Settlement[] = [];
  const settled = new Set<string>();
  const sortedBalances = workingBalances.sort((a, b) => b.net_balance_cents - a.net_balance_cents);
  for (let i = 0; i < sortedBalances.length; i++) {
    const creditor = sortedBalances[i];
    if (creditor.net_balance_cents <= 0) break;
    for (let j = sortedBalances.length - 1; j > i; j--) {
      const debtor = sortedBalances[j];
      if (debtor.net_balance_cents >= 0) break;
      const settlementKey = `${debtor.user_id}-${creditor.user_id}`;
      if (settled.has(settlementKey)) continue;
      const amount = Math.min(creditor.net_balance_cents, Math.abs(debtor.net_balance_cents));
      settlements.push({ from_user_id: debtor.user_id, to_user_id: creditor.user_id, amount_cents: amount });
      creditor.net_balance_cents -= amount;
      debtor.net_balance_cents += amount;
      settled.add(settlementKey);
      if (creditor.net_balance_cents === 0) break;
    }
  }
  return { balances, settlements };
}
