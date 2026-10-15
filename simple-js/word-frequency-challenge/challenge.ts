import { sampleFilePath } from "./init";

/**
 * The word frequency challenge.
 *
 * Read the text file at `filePath` and return the `top` most frequently
 * occurring words, most frequent first, as [word, count] pairs.
 *
 * Words should be compared case-insensitively and punctuation should be
 * ignored, so "The", "the" and "the." all count as the same word.
 *
 * Example (for the bundled sample.txt):
 *   topWords(sampleFilePath, 3) -> [["the", 8], ["fox", 4], ["dog", 4]]
 *   (words with equal counts may be returned in any order)
 *
 * @param filePath Path to the text file to analyse.
 * @param top How many words to return.
 */
const topWords = async (
  filePath: string,
  top: number,
): Promise<[string, number][]> => {
  return [];
};

export const main = async (filePath = sampleFilePath, top = 3) => {
  console.log("File:", filePath);
  console.log(`Top ${top} words:\n`, await topWords(filePath, Number(top)));
};
