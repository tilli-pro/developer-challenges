import { join } from "node:path";
import type { Arg, Tags } from "../types";

export const main = async (
  name: string,
  args: { update: boolean; dir: string },
) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(name, args.dir, Boolean(args.update));
  }
};

export const description =
  "Compare generated output against a stored snapshot, show a coloured unified diff, and update the snapshot on request.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["testing", "files", "diffing", "process"],
  minutes: 15,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[name]",
    description: "The snapshot name; the file is <dir>/<name>.txt.",
    defaultValue: "report",
  },
  {
    type: "flag",
    flag: "--update, -u",
    description: "Overwrite the snapshot with the current output.",
    defaultValue: false,
  },
  {
    type: "flag",
    flag: "--dir, -d [DIR]",
    description: "The directory that holds snapshot files.",
    defaultValue: () => join(import.meta.dirname, "snapshots"),
  },
] as const;
