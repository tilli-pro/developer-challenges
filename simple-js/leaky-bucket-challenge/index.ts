import type { Arg, Tags } from "../types";
import { randomInt } from "../utils";

export const main = async (
  timestamps: string,
  args: { capacity: number; rate: number },
) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    const parsedTimestamps = timestamps.split(",").map((t) => Number(t.trim()));
    await challengeModule.main(
      parsedTimestamps,
      Number(args.capacity),
      Number(args.rate),
    );
  }
};

export const description =
  "Decide which requests a leaky-bucket rate limiter accepts, given their timestamps, the bucket capacity and the leak rate.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["rate-limiting", "math", "arrays"],
  minutes: 20,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[timestamps]",
    description:
      "Comma-separated request timestamps in milliseconds, ascending.",
    defaultValue: () => {
      // A burst, then spaced-out requests, then a smaller burst.
      const gaps = [
        0,
        ...Array.from({ length: randomInt(3, 4) }, () => randomInt(20, 90)),
        ...Array.from({ length: randomInt(2, 3) }, () => randomInt(400, 1500)),
        ...Array.from({ length: randomInt(2, 3) }, () => randomInt(20, 90)),
      ];
      let now = 0;
      return gaps.map((gap) => (now += gap)).join(",");
    },
  },
  {
    type: "flag",
    flag: "--capacity, -c [NUM]",
    description: "How many units the bucket holds before it overflows.",
    defaultValue: 3,
  },
  {
    type: "flag",
    flag: "--rate, -r [NUM]",
    description: "How many units leak out of the bucket per second.",
    defaultValue: 1,
  },
] as const;
