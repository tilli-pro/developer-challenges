import type { Arg, Tags } from "../types";
import { sample, shuffle } from "../utils";

export const main = async (words: string) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    const parsedWords = words.split(",").map((w) => w.trim());
    await challengeModule.main(parsedWords);
  }
};

export const description = "Group a list of words into sets of anagrams.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["strings", "hashing", "grouping"],
  minutes: 15,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[words]",
    description: "Comma-separated list of words to group.",
    defaultValue: () => {
      const groups = [
        ["listen", "silent", "enlist"],
        ["cat", "act"],
        ["dog", "god"],
        ["night", "thing"],
        ["bird"],
        ["evil", "vile", "live"],
      ];
      return shuffle(sample(groups, 3).flat()).join(",");
    },
  },
] as const;
