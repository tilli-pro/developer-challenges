/** A time range as [start, end], where start <= end. */
export type Interval = [number, number];

/**
 * The merge intervals challenge.
 *
 * Given a list of time ranges (for example, busy slots on a calendar), merge
 * every pair of ranges that overlap or touch into a single range. Return the
 * merged ranges sorted by start time.
 *
 * Examples:
 *   mergeIntervals([[1, 3], [2, 6], [8, 10], [15, 18]]) -> [[1, 6], [8, 10], [15, 18]]
 *   mergeIntervals([[1, 4], [4, 5]])                    -> [[1, 5]]
 *
 * The input is not guaranteed to be sorted.
 *
 * @param intervals The list of [start, end] ranges to merge.
 */
const mergeIntervals = (intervals: Interval[]): Interval[] => {
  return [];
};

export const main = (intervals: Interval[]) => {
  console.log("Intervals:", intervals);
  console.log("Merged intervals:\n", mergeIntervals(intervals));
};
