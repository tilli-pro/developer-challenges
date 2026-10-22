import { execFile } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { rm } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { promisify } from "node:util";
import type { Feature, Project } from "../types";
import { copyDir } from "../utils";
import { commitAll, git, gitRaw } from "./git";

const run = promisify(execFile);

export type PrepareOptions = {
  project: Project;
  feature?: Feature;
  outDir: string;
  install: boolean;
  force: boolean;
  /** The CLI's own directory. `--force` never removes it or anything containing it. */
  cliRoot?: string;
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

/** True when `dir` is `path` or one of its ancestors. */
const contains = (dir: string, path: string) => {
  const rel = relative(resolve(dir), resolve(path));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
};

/** Throws unless `dir` looks like a work dir `prepare` built and is safe to delete. */
const assertRemovable = (dir: string, cliRoot?: string) => {
  const gitDir = join(dir, ".git");
  const isRepo = existsSync(gitDir) && statSync(gitDir).isDirectory();
  const protectedPaths = [process.cwd(), ...(cliRoot ? [cliRoot] : [])];
  if (!isRepo || protectedPaths.some((path) => contains(dir, path))) {
    throw new Error(
      `${dir} is not a prepared work dir; refusing to remove it.`,
    );
  }
};

/** Builds a git repo at `outDir`: `main` holds the base, and `feature/<slug>` the feature on top. */
export const prepare = async ({
  project,
  feature,
  outDir,
  install,
  force,
  cliRoot,
}: PrepareOptions): Promise<PrepareResult> => {
  if (existsSync(outDir)) {
    if (!force) {
      throw new Error(`${outDir} already exists. Pass --force to replace it.`);
    }
    assertRemovable(outDir, cliRoot);
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
    const diffStat = (
      await gitRaw(["diff", "--stat", `main..${featureBranch}`], outDir)
    ).replace(/\n+$/, "");
    result = { dir: outDir, featureBranch, diffStat };
  }

  if (install) {
    await run("pnpm", ["install"], { cwd: outDir });
  }
  return result;
};
