/**
 * Splits a monetary amount into integer-cent portions without losing pennies.
 * Remainder pennies start at `remainderStart`, which lets callers rotate who
 * receives the extra cent across multiple items.
 */
export function splitAmountIntoCents(
  amount: number,
  count: number,
  remainderStart = 0,
): number[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error('count must be a positive integer');
  }

  const totalCents = Math.round(amount * 100);
  if (!Number.isFinite(amount) || totalCents < 0) {
    throw new Error('amount must be a non-negative finite number');
  }

  const baseCents = Math.floor(totalCents / count);
  const remainder = totalCents % count;
  const normalizedStart = ((remainderStart % count) + count) % count;
  const portions = Array.from({ length: count }, () => baseCents);

  for (let offset = 0; offset < remainder; offset += 1) {
    portions[(normalizedStart + offset) % count] += 1;
  }

  return portions;
}

/** The largest useful split count when every child must be worth at least 1¢. */
export function getMaxNonZeroSplitCount(amount: number, requestedMaximum: number): number {
  const totalCents = Math.max(0, Math.round(amount * 100));
  return Math.min(totalCents, Math.max(0, Math.floor(requestedMaximum)));
}

export function getSplitPriceRange(amount: number, count: number): {
  minimumCents: number;
  maximumCents: number;
} {
  const portions = splitAmountIntoCents(amount, count);
  return {
    minimumCents: Math.min(...portions),
    maximumCents: Math.max(...portions),
  };
}
