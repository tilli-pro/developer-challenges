/**
 * The anagram challenge.
 *
 * Group a list of words so that words which are anagrams of each other end up
 * in the same group. Two words are anagrams when they contain exactly the same
 * letters in a different order (e.g. "listen" and "silent").
 *
 * Example:
 *   groupAnagrams(["listen", "silent", "cat", "act", "dog"])
 *     -> [["listen", "silent"], ["cat", "act"], ["dog"]]
 *
 * The order of the groups, and of words within a group, does not matter.
 *
 * @param words The list of words to group.
 */
const groupAnagrams = (words: string[]): string[][] => {
  return [];
};

export const main = (words: string[]) => {
  console.log("Words:", words);
  console.log("Anagram groups:\n", groupAnagrams(words));
};
