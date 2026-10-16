import type { Arg, Tags } from "../types";
import { pick } from "../utils";

export const main = async (query: string) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(query);
  }
};

export const description =
  "Parse a URL query string into an object, collecting repeated keys into arrays.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["strings", "urls", "objects"],
  minutes: 15,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[query]",
    description: "The query string to parse, with or without a leading '?'.",
    defaultValue: () =>
      pick([
        "?page=2&sort=name&tag=js&tag=ts",
        "q=hello+world&lang=en",
        "name=Ada%20Lovelace&born=1815&debug",
        "ids=1&ids=2&ids=3&verbose=",
        "redirect=%2Fdashboard%3Ftab%3D1&from=login",
      ]),
  },
] as const;
