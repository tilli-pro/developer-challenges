import type { Arg, Tags } from "../types";
import { pick, randomInt } from "../utils";

export const main = async (date: string, args: { now: string }) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(new Date(date), new Date(args.now));
  }
};

export const description =
  "Describe a timestamp relative to now, such as '3 minutes ago' or 'in 2 days'.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["dates", "math", "formatting"],
  minutes: 15,
};

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;

export const args: Arg[] = [
  {
    type: "arg",
    arg: "[date]",
    description: "The timestamp to describe, as an ISO 8601 string.",
    defaultValue: () => {
      // A random offset from now, spread across magnitudes and both directions.
      const magnitude = pick([
        randomInt(5, 44) * second,
        randomInt(45, 59) * second,
        randomInt(1, 59) * minute,
        randomInt(1, 23) * hour,
        randomInt(1, 6) * day,
        randomInt(7, 29) * day,
        randomInt(30, 364) * day,
        randomInt(365, 365 * 5) * day,
      ]);
      const sign = pick([-1, 1]);
      return new Date(Date.now() + sign * magnitude).toISOString();
    },
  },
  {
    type: "flag",
    flag: "--now, -n [ISO]",
    description: "The reference time, as an ISO 8601 string. Defaults to now.",
    defaultValue: () => new Date().toISOString(),
  },
] as const;
