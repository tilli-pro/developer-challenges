import { isInDictionary } from "./init";

/**
 * The dictionary challenge.
 *
 * Determine if the `testString` param has `minWords` or more substrings that
 * are words in the English dictionary. A word must be at least 2 characters
 * long; shorter substrings never count.
 *
 * Use the `isInDictionary` function to check if a substring is a valid English
 * word. It already rejects strings shorter than 2 characters.
 *
 * @param testString
 * @param minWords The minimum number of words that must be in the dictionary.
 */
const hasWordsInDictionary = (testString: string, minWords = 2) => {
  return false;
};

export const main = (
  testString?: string,
  minWords = 2,
  showDictExample = false,
) => {
  if (showDictExample) {
    console.log("Example usage of isInDictionary function:");
    console.log(`isInDictionary("example"):`, isInDictionary("example"));
    console.log(
      `isInDictionary("nonexistentword"):`,
      isInDictionary("nonexistentword"),
    );
  }

  if (!testString) {
    return;
  }

  console.log("Testing string:", testString);
  console.log(
    `Has ${minWords} or more substrings in the English dictionary?\n`,
    hasWordsInDictionary(testString, minWords),
  );
};
