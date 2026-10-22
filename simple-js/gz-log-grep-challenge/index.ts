import { join } from "node:path";
import type { Arg, Tags } from "../types";
import { pick } from "../utils";

export const main = async (
  pattern: string,
  args: { dir: string; ignoreCase: boolean },
) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(pattern, args.dir, Boolean(args.ignoreCase));
  }
};

export const description =
  "Search gzipped log files for a pattern by streaming them, without decompressing to disk.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["streams", "compression", "files", "regex"],
  minutes: 20,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[pattern]",
    description: "Regular expression to search for.",
    defaultValue: () => pick(["ERROR", "timeout", "user=42", "payment"]),
  },
  {
    type: "flag",
    flag: "--dir, -d [DIR]",
    description: "Folder containing .log.gz files (searched recursively).",
    defaultValue: () => join(import.meta.dirname, "logs"),
  },
  {
    type: "flag",
    flag: "--ignore-case, -i",
    description: "Match case-insensitively.",
    defaultValue: false,
  },
] as const;
