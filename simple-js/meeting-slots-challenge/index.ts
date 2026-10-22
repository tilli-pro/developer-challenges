import type { Arg, Tags } from "../types";
import type { Person } from "./challenge";

export const main = async (
  people: string,
  args: { week: string; hours: string; duration: number },
) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    const parsedPeople: Person[] = people.split(",").map((entry) => {
      const [name, zone] = entry.trim().split(":");
      return { name: name ?? "", zone: zone ?? "UTC" };
    });
    const [start, end] = args.hours.split("-").map(Number);
    await challengeModule.main(
      parsedPeople,
      args.week,
      [start ?? 9, end ?? 17],
      Number(args.duration),
    );
  }
};

/** The Monday on or after today, as YYYY-MM-DD. */
const nextMonday = () => {
  const date = new Date();
  const daysUntilMonday = (8 - date.getUTCDay()) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysUntilMonday);
  return date.toISOString().slice(0, 10);
};

export const description =
  "Find meeting slots inside everyone's working hours across several timezones for a given week. Adding Dan:Asia/Tokyo to the default people produces none.\n";
export const tags: Tags = {
  difficulty: "medium",
  topics: ["dates", "timezones", "intervals", "scheduling"],
  minutes: 25,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[people]",
    description:
      'Comma-separated name:zone pairs, e.g. "Ada:Europe/London,Ben:Asia/Tokyo".',
    defaultValue: "Ada:Europe/London,Ben:Europe/Berlin,Cara:America/New_York",
  },
  {
    type: "flag",
    flag: "--week, -w [DATE]",
    description: "The Monday that starts the week, as YYYY-MM-DD.",
    defaultValue: nextMonday,
  },
  {
    type: "flag",
    flag: "--hours, -h [START-END]",
    description: "Working hours in each person's local time, e.g. 9-17.",
    defaultValue: "9-17",
  },
  {
    type: "flag",
    flag: "--duration, -d [MINUTES]",
    description: "How long the meeting is.",
    defaultValue: 60,
  },
] as const;
