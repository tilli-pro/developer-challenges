import type { Arg, Tags } from "../types";
import { pick, sample } from "../utils";

export const main = async (inputs: string) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    const parsedInputs = inputs.split(",").map((n) => Number(n.trim()));
    await challengeModule.main(parsedInputs);
  }
};

export const description =
  "Wrap a function so repeat calls with the same arguments return a cached result instead of recomputing.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["closures", "hashing", "caching"],
  minutes: 15,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[inputs]",
    description:
      "Comma-separated list of numbers to pass through the memoized function.",
    defaultValue: () => {
      // Draw from only 4 distinct values so repeats are guaranteed.
      const distinct = sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
      return Array.from({ length: 8 }, () => pick(distinct)).join(",");
    },
  },
] as const;
