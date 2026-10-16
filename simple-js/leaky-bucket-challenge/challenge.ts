/**
 * The leaky bucket challenge.
 *
 * A leaky bucket rate limiter is a meter. Picture a bucket with a hole in
 * the bottom:
 *   - It starts empty.
 *   - Water leaks out continuously at `ratePerSecond` units per second, and
 *     the level never drops below zero.
 *   - Each request tries to pour one unit in. First work out how much has
 *     leaked since the previous request, then: if that one unit fits without
 *     overflowing (`level + 1 <= capacity`), accept the request and add it;
 *     otherwise reject it and leave the level unchanged.
 *
 * Return one boolean per request, in order: true for accepted, false for
 * rejected. `timestamps` are milliseconds and are sorted ascending.
 *
 * Worked example with capacity 2 and rate 1 per second:
 *   t=0     level 0.0, 0.0 + 1 <= 2 -> accept, level 1.0
 *   t=100   leaked 0.1, level 0.9, 0.9 + 1 <= 2 -> accept, level 1.9
 *   t=200   leaked 0.1, level 1.8, 1.8 + 1 >  2 -> reject, level 1.8
 *   t=1200  leaked 1.0, level 0.8, 0.8 + 1 <= 2 -> accept, level 1.8
 *   t=1300  leaked 0.1, level 1.7, 1.7 + 1 >  2 -> reject, level 1.7
 *
 *   leakyBucket([0, 100, 200, 1200, 1300], 2, 1) -> [true, true, false, true, false]
 *
 * @param timestamps Request times in milliseconds, ascending.
 * @param capacity The bucket size in units.
 * @param ratePerSecond How many units leak out per second.
 */
const leakyBucket = (
  timestamps: number[],
  capacity: number,
  ratePerSecond: number,
): boolean[] => {
  return [];
};

export const main = (
  timestamps: number[],
  capacity: number,
  ratePerSecond: number,
) => {
  console.log("Timestamps (ms):", timestamps);
  console.log("Capacity:", capacity, "units");
  console.log("Leak rate:", ratePerSecond, "units/second");

  const decisions = leakyBucket(timestamps, capacity, ratePerSecond);
  console.log("\n  TIME     DECISION");
  timestamps.forEach((t, i) => {
    const decision =
      decisions[i] === undefined ? "?" : decisions[i] ? "accepted" : "rejected";
    console.log(`  ${String(t).padStart(6)}ms ${decision}`);
  });
  const accepted = decisions.filter(Boolean).length;
  console.log(`\nAccepted ${accepted} of ${timestamps.length} requests`);
};
