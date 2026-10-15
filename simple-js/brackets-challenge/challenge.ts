/**
 * The balanced brackets challenge.
 *
 * Determine whether every opening bracket in `testString` is closed by the
 * matching type of bracket, in the correct order. The bracket pairs are
 * `()`, `[]` and `{}`. Any other characters should be ignored.
 *
 * Examples:
 *   isBalanced("{[()]}")      -> true
 *   isBalanced("a(b)c[d]")    -> true
 *   isBalanced("([)]")        -> false
 *   isBalanced("((")          -> false
 *
 * @param testString The string to check.
 */
const isBalanced = (testString: string): boolean => {
  return false;
};

export const main = (testString: string) => {
  console.log("Testing string:", testString);
  console.log("Brackets are balanced?\n", isBalanced(testString));
};
