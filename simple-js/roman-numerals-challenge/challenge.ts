/**
 * The Roman numerals challenge.
 *
 * Convert a positive integer (1 to 3999) to its Roman numeral representation.
 *
 * The symbols are: I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000.
 * Symbols are normally written largest to smallest and added together, but
 * 4 and 9 use subtraction: IV = 4, IX = 9, XL = 40, XC = 90, CD = 400, CM = 900.
 *
 * Examples:
 *   toRoman(3)    -> "III"
 *   toRoman(14)   -> "XIV"
 *   toRoman(1994) -> "MCMXCIV"
 *
 * @param num The integer to convert.
 */
const toRoman = (num: number): string => {
  return "";
};

export const main = (num: number) => {
  console.log("Number:", num);
  console.log("Roman numeral:\n", toRoman(num));
};
