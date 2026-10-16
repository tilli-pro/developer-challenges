/**
 * The deep equal challenge.
 *
 * Decide whether two values are structurally equal. Primitives are compared
 * by value. Arrays are equal when they have the same length and every element
 * is deep-equal in order. Plain objects are equal when they have the same set
 * of keys and every value is deep-equal; key order does not matter.
 *
 * Examples:
 *   deepEqual(1, 1)                               -> true
 *   deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })     -> true
 *   deepEqual([1, [2, 3]], [1, [2, 3]])           -> true
 *   deepEqual({ a: [1, 2] }, { a: [2, 1] })       -> false
 *   deepEqual({ a: 1 }, { a: 1, b: undefined })   -> false
 *   deepEqual(null, {})                           -> false
 *
 * @param a The first value.
 * @param b The second value.
 */
const deepEqual = (a: unknown, b: unknown): boolean => {
  return false;
};

export const main = (a: unknown, b: unknown) => {
  console.log("A:", JSON.stringify(a));
  console.log("B:", JSON.stringify(b));
  console.log("Deep equal:\n", deepEqual(a, b));
};
