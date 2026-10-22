import { writeFile } from "node:fs/promises";
import type { Feature } from "../types";
import { gitRaw } from "./git";

export type RegenOptions = { feature: Feature; fromDir: string };
export type RegenResult = { patchPath: string; filesChanged: number };

/** Rewrites the feature's `changes.patch` from `git diff main..HEAD` in `fromDir`. */
export const regen = async ({
  feature,
  fromDir,
}: RegenOptions): Promise<RegenResult> => {
  const patch = await gitRaw(["diff", "--binary", "main..HEAD"], fromDir);
  if (patch.trim() === "") {
    throw new Error(`No changes between main and HEAD in ${fromDir}`);
  }
  await writeFile(
    feature.patchPath,
    patch.endsWith("\n") ? patch : `${patch}\n`,
  );
  const filesChanged = patch
    .split("\n")
    .filter((line) => line.startsWith("diff --git ")).length;
  return { patchPath: feature.patchPath, filesChanged };
};
