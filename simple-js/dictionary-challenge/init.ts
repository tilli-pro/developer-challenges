import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import Dictionary from "en-dictionary";

const require = createRequire(import.meta.url);
const wordnetPath = join(
  dirname(require.resolve("en-wordnet/package.json")),
  "database",
  "3.0",
);

const dictionary = new Dictionary(wordnetPath);
await dictionary.init();

/**
 * Checks whether a string is recognized in the English dictionary.
 *
 * @param chars - The string to look up.
 * @returns `true` if the English dictionary recognizes the string as an English word; otherwise, `false`.
 */
export const isInDictionary = (chars: string) => {
  const result = dictionary.searchSimpleFor([chars]);
  return (result.get(chars)?.size ?? 0) > 0;
};
