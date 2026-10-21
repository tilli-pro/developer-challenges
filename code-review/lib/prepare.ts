import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import type { Feature, Project } from "../types";
import { copyDir } from "../utils";
import { commitAll, git } from "./git";

const run = promisify(execFile);

export type PrepareOptions = {
  project: Project;
  feature?: Feature;
  outDir: string;
  install: boolean;
  force: boolean;
};
export type PrepareResult = {
  dir: string;
  featureBranch?: string;
  diffStat?: string;
};

export const workDirFor = (root: string, project: Project, feature?: Feature) =>
  join(
    root,
    ".work",
    feature ? `${project.slug}-${feature.slug}` : project.slug,
  );

/** Builds a git repo at `outDir`: `main` holds the base, and `feature/<slug>` the feature on top. */
export const prepare = async ({
  project,
  feature,
  outDir,
  install,
  force,
}: PrepareOptions): Promise<PrepareResult> => {
  if (existsSync(outDir)) {
    if (!force) {
      throw new Error(`${outDir} already exists. Pass --force to replace it.`);
    }
    await rm(outDir, { recursive: true, force: true });
  }
  await copyDir(project.baseDir, outDir);
  await git(["init", "-q", "-b", "main"], outDir);
  await commitAll(outDir, "Initial codebase");

  let result: PrepareResult = { dir: outDir };
  if (feature) {
    const featureBranch = `feature/${feature.slug}`;
    try {
      await git(["checkout", "-q", "-b", featureBranch], outDir);
      await git(["apply", "--index", feature.patchPath], outDir);
    } catch (error) {
      await rm(outDir, { recursive: true, force: true });
      throw error;
    }
    await commitAll(outDir, feature.meta.title, feature.meta.body);
    const diffStat = await git(
      ["diff", "--stat", `main..${featureBranch}`],
      outDir,
    );
    result = { dir: outDir, featureBranch, diffStat };
  }

  if (install) {
    await run("pnpm", ["install"], { cwd: outDir });
  }
  return result;
};
