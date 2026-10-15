import type { Arg, Tags } from "../types";
import { pick, randomInt } from "../utils";

export const main = async (
  testString: string,
  args: {
    minWords: number;
    showDictExample: boolean;
  },
) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(testString, args.minWords, args.showDictExample);
  }
};

export const description =
  "Determine if any number of substrings in a test string are in the English dictionary.\n";
export const tags: Tags = {
  difficulty: "medium",
  topics: ["strings", "search", "dynamic-programming"],
  minutes: 30,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[test-string]",
    description: "The test string to check against the English dictionary.",
    defaultValue: () => {
      const words = [
        "cat",
        "dog",
        "book",
        "shelf",
        "sun",
        "flower",
        "rain",
        "bow",
      ];
      const gibberish = ["xq", "zj", "vk", "qp"];
      const parts = [pick(words), pick(words), pick(gibberish)];
      return parts.slice(0, randomInt(2, 3)).join("");
    },
  },
  {
    type: "flag",
    flag: "--min-words, -m [NUM]",
    description: "The minimum number of words that must be in the dictionary.",
    defaultValue: 2,
  },
  {
    type: "flag",
    flag: "--show-dict-example, -s",
    description:
      "Whether to show example usage of the isInDictionary function.",
    defaultValue: false,
  },
] as const;
