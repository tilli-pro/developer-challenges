/** An array whose items are numbers or further nested arrays of numbers. */
export type NestedArray = (number | NestedArray)[];

/**
 * The flatten challenge.
 *
 * Turn an arbitrarily nested array of numbers into a single flat array,
 * keeping the original left-to-right order.
 *
 * Examples:
 *   flatten([1, [2, 3], [4, [5]]]) -> [1, 2, 3, 4, 5]
 *   flatten([[[[1]]]])              -> [1]
 *   flatten([])                     -> []
 *
 * Try to solve this without using `Array.prototype.flat`.
 *
 * @param nested The nested array to flatten.
 */
const flatten = (nested: NestedArray): number[] => {
  return [];
};

export const main = (nested: NestedArray) => {
  console.log("Nested:", JSON.stringify(nested));
  console.log("Flattened:\n", flatten(nested));
};
