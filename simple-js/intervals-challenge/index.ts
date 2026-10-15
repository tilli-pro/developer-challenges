import type { Arg, Tags } from "../types";
import { randomInt } from "../utils";
import type { Interval } from "./challenge";

export const main = async (intervals: string) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    const parsedIntervals: Interval[] = intervals.split(",").map((range) => {
      const [start, end] = range.trim().split("-").map(Number);
      return [start ?? 0, end ?? 0];
    });
    await challengeModule.main(parsedIntervals);
  }
};

export const description =
  "Merge overlapping time ranges into a single list of non-overlapping ranges.\n";
export const tags: Tags = {
  difficulty: "medium",
  topics: ["arrays", "sorting", "intervals"],
  minutes: 25,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[intervals]",
    description:
      'Comma-separated list of start-end ranges, e.g. "1-3,2-6,8-10,15-18".',
    defaultValue: () =>
      Array.from({ length: randomInt(4, 6) }, () => {
        const start = randomInt(0, 20);
        return `${start}-${start + randomInt(1, 5)}`;
      }).join(","),
  },
] as const;
