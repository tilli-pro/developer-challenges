import { join } from "node:path";
import type { Arg, Tags } from "../types";

export const main = async (
  file: string,
  args: { maxDepth: number; write: boolean },
) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(file, Number(args.maxDepth), args.write);
  }
};

export const description =
  "Generate a GitHub-style table of contents for a markdown file and insert it between marker comments.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["markdown", "strings", "files", "slugs"],
  minutes: 20,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[file]",
    description:
      "Path to a markdown file containing <!-- toc --> and <!-- /toc --> markers. Defaults to the bundled sample.md.",
    defaultValue: () => join(import.meta.dirname, "sample.md"),
  },
  {
    type: "flag",
    flag: "--max-depth, -d [NUM]",
    description: "Deepest heading level to include (2 = only H2s).",
    defaultValue: 3,
  },
  {
    type: "flag",
    flag: "--write, -w",
    description:
      "Write the result back to the file instead of only printing it.",
    defaultValue: false,
  },
] as const;
