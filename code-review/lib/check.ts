import { execFile } from "node:child_process";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import type { Feature, Project } from "../types";
import { git } from "./git";
import { prepare } from "./prepare";

export type CheckRow = {
  project: string;
  feature: string;
  applies: boolean;
  baseTypecheck: boolean;
  baseTest: boolean;
  featureTypecheck: boolean;
  featureTest: boolean;
  error?: string;
};

/** True when every check in the row passed. */
export const rowOk = (row: CheckRow) =>
  row.applies &&
  row.baseTypecheck &&
  row.baseTest &&
  row.featureTypecheck &&
  row.featureTest;

/** Resolves true when `pnpm run <script>` exits 0. */
const script = (name: string, cwd: string) =>
  new Promise<boolean>((resolve) => {
    execFile(
      "pnpm",
      ["run", name],
      { cwd, maxBuffer: 16 * 1024 * 1024 },
      (error) => resolve(!error),
    );
  });

/** Applies the feature to a scratch repo and runs typecheck and test on main and on the feature branch. */
export const checkFeature = async (
  project: Project,
  feature: Feature,
  tmpRoot: string,
): Promise<CheckRow> => {
  const dir = join(tmpRoot, `${project.slug}-${feature.slug}`);
  const row: CheckRow = {
    project: project.slug,
    feature: feature.slug,
    applies: false,
    baseTypecheck: false,
    baseTest: false,
    featureTypecheck: false,
    featureTest: false,
  };
  try {
    const { featureBranch } = await prepare({
      project,
      feature,
      outDir: dir,
      install: true,
      force: true,
    });
    row.applies = true;
    await git(["checkout", "-q", "main"], dir);
    row.baseTypecheck = await script("typecheck", dir);
    row.baseTest = await script("test", dir);
    await git(
      ["checkout", "-q", featureBranch ?? `feature/${feature.slug}`],
      dir,
    );
    row.featureTypecheck = await script("typecheck", dir);
    row.featureTest = await script("test", dir);
  } catch (error) {
    row.error = error instanceof Error ? error.message : String(error);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  return row;
};
