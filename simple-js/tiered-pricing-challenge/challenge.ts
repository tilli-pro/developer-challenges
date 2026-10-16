/** A pricing tier: `size` units at `rate` each. `null` size means unbounded. */
export type Tier = { size: number | null; rate: number };

export type BillLine = { units: number; rate: number; cost: number };

export type Bill = { total: number; lines: BillLine[] };

/**
 * The tiered pricing challenge.
 *
 * Usage-based products bill in tiers: the first N units cost one rate, the
 * next M units a lower rate, and so on. Every unit is billed at the rate of
 * the tier it falls into, so a customer using 150 units with tiers
 * [100 @ 0.10, rest @ 0.05] pays 100 × 0.10 + 50 × 0.05, not 150 × 0.05.
 *
 * Return one line per tier that was actually used (skip tiers that got zero
 * units), and the total rounded to two decimal places.
 *
 * Example (tiers = [{ size: 100, rate: 0.1 }, { size: 400, rate: 0.08 }, { size: null, rate: 0.05 }]):
 *   computeBill(60, tiers)  -> { total: 6, lines: [{ units: 60, rate: 0.1, cost: 6 }] }
 *   computeBill(100, tiers) -> { total: 10, lines: [{ units: 100, rate: 0.1, cost: 10 }] }
 *   computeBill(650, tiers) -> {
 *     total: 49.5,
 *     lines: [
 *       { units: 100, rate: 0.1, cost: 10 },
 *       { units: 400, rate: 0.08, cost: 32 },
 *       { units: 150, rate: 0.05, cost: 7.5 },
 *     ],
 *   }
 *
 * @param units The number of units used. Non-negative.
 * @param tiers The tiers in order, cheapest-first is not assumed.
 */
const computeBill = (units: number, tiers: Tier[]): Bill => {
  return { total: 0, lines: [] };
};

export const main = (units: number, tiers: Tier[]) => {
  console.log("Units:", units);
  console.log("Tiers:", tiers);
  console.log("Bill:\n", computeBill(units, tiers));
};
