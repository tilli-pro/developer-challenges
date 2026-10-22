/**
 * Money is always an integer number of minor units (cents, pence), and rates
 * are integer basis points (1 bps = 0.01%). Anything fractional is rounded
 * back to whole cents before it is stored or returned.
 */

export const CURRENCIES = ["USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const BPS_DENOMINATOR = 10_000;

export function assertCents(value: number, label = "amount"): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be a safe integer, got ${value}`);
  }
  return value;
}

export function multiplyCents(unitCents: number, quantity: number): number {
  return assertCents(unitCents * quantity, "line amount");
}

export function sumCents(values: readonly number[]): number {
  return assertCents(
    values.reduce((total, value) => total + value, 0),
    "sum",
  );
}
