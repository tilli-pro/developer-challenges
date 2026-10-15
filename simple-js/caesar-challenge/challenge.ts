/**
 * The Caesar cipher challenge.
 *
 * Encode `message` by shifting every letter `shift` places forward in the
 * alphabet, wrapping around from "z" back to "a". Upper and lower case letters
 * should keep their case. Any non-letter character (spaces, digits,
 * punctuation) should be left unchanged.
 *
 * Examples:
 *   encode("abc", 1)          -> "bcd"
 *   encode("Hello, World!", 3) -> "Khoor, Zruog!"
 *   encode("xyz", 3)          -> "abc"
 *
 * @param message The text to encode.
 * @param shift How many places to shift each letter (0-25).
 */
const encode = (message: string, shift: number): string => {
  return "";
};

export const main = (message: string, shift = 3) => {
  console.log("Message:", message);
  console.log("Shift:", shift);
  console.log("Encoded:\n", encode(message, shift));
};
