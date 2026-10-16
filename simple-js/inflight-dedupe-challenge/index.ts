import type { Arg, Tags } from "../types";
import { pick, sample } from "../utils";

export const main = async (keys: string) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    const parsedKeys = keys.split(",").map((k) => k.trim());
    await challengeModule.main(parsedKeys);
  }
};

export const description =
  "Wrap an async fetcher so concurrent calls for the same key share one in-flight request instead of each hitting the backend.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["async", "promises", "maps", "caching"],
  minutes: 20,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[keys]",
    description: "Comma-separated list of keys to fetch, repeats allowed.",
    defaultValue: () => {
      // Draw from only 3 distinct keys so repeats are guaranteed.
      const distinct = sample(
        ["user:1", "user:2", "user:3", "order:9", "order:10"],
        3,
      );
      return Array.from({ length: pick([7, 8]) }, () => pick(distinct)).join(
        ",",
      );
    },
  },
] as const;
