import type { Arg, Tags } from "../types";
import { pick } from "../utils";

export const main = async (
  rule: string,
  args: { count: number; from: string; locale: string },
) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(
      rule,
      args.from,
      Number(args.count),
      args.locale,
    );
  }
};

export const description =
  "Expand an iCalendar recurrence rule into its next occurrences and print them localized.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["dates", "recurrence", "intl", "timezones"],
  minutes: 20,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[rule]",
    description: 'An iCalendar RRULE, e.g. "FREQ=MONTHLY;BYDAY=2TU".',
    defaultValue: () =>
      pick([
        "FREQ=MONTHLY;BYDAY=2TU",
        "FREQ=WEEKLY;BYDAY=MO,WE,FR",
        "FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25",
        "FREQ=DAILY;INTERVAL=3",
        "FREQ=MONTHLY;BYMONTHDAY=-1",
      ]),
  },
  {
    type: "flag",
    flag: "--count, -c [NUM]",
    description: "How many occurrences to list.",
    defaultValue: 5,
  },
  {
    type: "flag",
    flag: "--from, -f [DATE]",
    description: "The date (YYYY-MM-DD) to start from, inclusive.",
    defaultValue: () => new Date().toISOString().slice(0, 10),
  },
  {
    type: "flag",
    flag: "--locale, -l [TAG]",
    description: "The BCP 47 locale to format dates in.",
    defaultValue: "en-GB",
  },
] as const;
