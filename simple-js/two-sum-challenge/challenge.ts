/**
 * The two sum challenge.
 *
 * Given a list of item prices and a budget, find two items whose prices add
 * up to exactly the budget. Return the two prices as a pair, or `null` if no
 * such pair exists.
 *
 * Examples:
 *   findPairForBudget([3, 8, 12, 5, 15, 7], 20) -> [8, 12]
 *   findPairForBudget([3, 8, 12, 5, 15, 7], 100) -> null
 *
 * @param prices The list of item prices.
 * @param budget The exact amount the two prices must sum to.
 */
const findPairForBudget = (
  prices: number[],
  budget: number,
): [number, number] | null => {
  return null;
};

export const main = (prices: number[], budget = 20) => {
  console.log("Prices:", prices);
  console.log("Budget:", budget);
  console.log("Pair that sums to budget:\n", findPairForBudget(prices, budget));
};
