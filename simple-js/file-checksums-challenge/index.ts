import { join } from "node:path";
import type { Arg, Tags } from "../types";

export const main = async (dir: string, args: { manifest: string }) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(dir, args.manifest);
  }
};

export const description =
  "Verify files against a SHA256SUMS manifest using streaming hashes, reporting mismatches, missing and untracked files.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["crypto", "streams", "files", "integrity"],
  minutes: 15,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[dir]",
    description: "Folder containing the files to verify.",
    defaultValue: () => join(import.meta.dirname, "files"),
  },
  {
    type: "flag",
    flag: "--manifest, -m [FILE]",
    description: "Path to the SHA256SUMS manifest.",
    defaultValue: () => join(import.meta.dirname, "files", "SHA256SUMS"),
  },
] as const;
