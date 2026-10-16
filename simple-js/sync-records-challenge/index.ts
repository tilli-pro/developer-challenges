import type { Arg, Tags } from "../types";
import { pick } from "../utils";
import type { Record } from "./challenge";

const parseRecords = (list: string): Record[] =>
  list.split(",").map((entry) => {
    const [id, name] = entry.trim().split(":");
    return { id: id ?? "", name: name ?? "" };
  });

export const main = async (oldList: string, args: { new: string }) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(parseRecords(oldList), parseRecords(args.new));
  }
};

export const description =
  "Compare an old and a new list of records by id and report which were created, updated and deleted.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["arrays", "hashing", "diffing"],
  minutes: 15,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[old]",
    description:
      'Comma-separated list of id:name pairs as they were, e.g. "1:Ada,2:Ben".',
    defaultValue: "1:Ada,2:Ben,3:Cara,4:Dee,5:Eli",
  },
  {
    type: "flag",
    flag: "--new, -n [LIST]",
    description: "Comma-separated list of id:name pairs as they are now.",
    defaultValue: () =>
      pick([
        // One renamed.
        "1:Ada,2:Benjamin,3:Cara,4:Dee,5:Eli",
        // One removed.
        "1:Ada,2:Ben,4:Dee,5:Eli",
        // One added.
        "1:Ada,2:Ben,3:Cara,4:Dee,5:Eli,6:Fay",
        // Renamed, removed and added at once, in a different order.
        "6:Fay,5:Eli,3:Carina,1:Ada,2:Ben",
        // Everything replaced.
        "7:Gus,8:Hal",
        // Identical, reordered.
        "5:Eli,4:Dee,3:Cara,2:Ben,1:Ada",
      ]),
  },
] as const;
