import type { Arg, Tags } from "../types";
import { randomInt } from "../utils";

export const main = async (durations: string, args: { limit: number }) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    const parsedDurations = durations.split(",").map((d) => Number(d.trim()));
    await challengeModule.main(parsedDurations, Number(args.limit));
  }
};

export const description =
  "Run a list of async tasks with at most N in flight at once, returning results in input order.\n";
export const tags: Tags = {
  difficulty: "medium",
  topics: ["async", "promises", "concurrency"],
  minutes: 25,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[durations]",
    description:
      "Comma-separated list of task durations in milliseconds. Each one becomes a task that waits that long.",
    defaultValue: () =>
      Array.from({ length: randomInt(5, 7) }, () => randomInt(1, 5) * 100).join(
        ",",
      ),
  },
  {
    type: "flag",
    flag: "--limit, -l [NUM]",
    description: "The maximum number of tasks running at the same time.",
    defaultValue: 2,
  },
] as const;
