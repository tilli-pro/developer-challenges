import { join } from "node:path";
import type { Arg, Tags } from "../types";

export const main = async (
  repo: string,
  args: { weeks: number; max: number },
) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(repo, Number(args.weeks), Number(args.max));
  }
};

export const description =
  "Run git log on a repository and summarise commits per ISO week and author.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["child-process", "parsing", "dates", "git"],
  minutes: 20,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[repo]",
    description:
      "Path to a git repository. Defaults to the developer-challenges repo.",
    defaultValue: () => join(import.meta.dirname, "..", ".."),
  },
  {
    type: "flag",
    flag: "--weeks, -w [NUM]",
    description: "How many ISO weeks back to include, counting this one.",
    defaultValue: 8,
  },
  {
    type: "flag",
    flag: "--max, -m [NUM]",
    description: "The maximum number of commits to read from git log.",
    defaultValue: 500,
  },
] as const;
