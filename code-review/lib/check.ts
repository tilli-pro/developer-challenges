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
  /** The tail of each failing step's output, labelled with the step name. */
  details?: string;
};

/** True when every check in the row passed. */
export const rowOk = (row: CheckRow) =>
  row.applies &&
  row.baseTypecheck &&
  row.baseTest &&
  row.featureTypecheck &&
  row.featureTest;

const TAIL_LINES = 15;

type ScriptResult = { ok: boolean; output: string };

/** Runs `pnpm run <script>`; `ok` is true when it exits 0, and `output` is the last lines of stdout and stderr. */
const script = (name: string, cwd: string) =>
  new Promise<ScriptResult>((resolve) => {
    execFile(
      "pnpm",
      ["run", name],
      { cwd, maxBuffer: 16 * 1024 * 1024 },
      (error, stdout, stderr) => {
        const lines = `${stdout}\n${stderr}`
          .split("\n")
          .filter((line) => line.trim() !== "");
        resolve({
          ok: !error,
          output: lines.slice(-TAIL_LINES).join("\n"),
        });
      },
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
  const failures: string[] = [];
  const step = async (label: string, name: string) => {
    const { ok, output } = await script(name, dir);
    if (!ok) {
      failures.push(`${label}:\n${output}`);
    }
    return ok;
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
    row.baseTypecheck = await step("base typecheck", "typecheck");
    row.baseTest = await step("base test", "test");
    await git(
      ["checkout", "-q", featureBranch ?? `feature/${feature.slug}`],
      dir,
    );
    row.featureTypecheck = await step("feature typecheck", "typecheck");
    row.featureTest = await step("feature test", "test");
  } catch (error) {
    row.error = error instanceof Error ? error.message : String(error);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  if (failures.length > 0) {
    row.details = failures.join("\n");
  }
  return row;
};
