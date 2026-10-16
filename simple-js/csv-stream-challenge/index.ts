import type { Arg, Tags } from "../types";
import { sampleFilePath } from "./init";

export const main = async (
  filePath: string | undefined,
  args: { limit: number },
) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(filePath, Number(args.limit));
  }
};

export const description =
  "Stream a CSV file line by line with readline and parse it into objects, handling quoted fields that contain commas, quotes and newlines.\n";
export const tags: Tags = {
  difficulty: "medium",
  topics: ["strings", "parsing", "streams", "files", "async"],
  minutes: 25,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[file]",
    description:
      "Path to a CSV file. Defaults to the sample.csv bundled with the challenge.",
    defaultValue: () => sampleFilePath,
  },
  {
    type: "flag",
    flag: "--limit, -l [NUM]",
    description: "How many parsed rows to print.",
    defaultValue: 5,
  },
] as const;
