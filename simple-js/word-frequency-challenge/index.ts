import { join } from "node:path";
import type { Arg, Tags } from "../types";

export const main = async (
  filePath: string | undefined,
  args: { top: number },
) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(filePath, Number(args.top));
  }
};

export const description =
  "Find the most frequently occurring words in a text file.\n";
export const tags: Tags = {
  difficulty: "medium",
  topics: ["strings", "files", "hashing", "sorting", "async"],
  minutes: 25,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[file]",
    description:
      "Path to a text file. Defaults to the sample.txt bundled with the challenge.",
    defaultValue: () => join(import.meta.dirname, "sample.txt"),
  },
  {
    type: "flag",
    flag: "--top, -t [NUM]",
    description: "How many of the most frequent words to show.",
    defaultValue: 3,
  },
] as const;
