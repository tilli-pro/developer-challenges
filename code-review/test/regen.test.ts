import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { commitAll, git } from "../lib/git";
import { prepare, workDirFor } from "../lib/prepare";
import { findFeature, findProject, loadProjects } from "../lib/projects";
import { regen } from "../lib/regen";
import { withTempFixtures } from "./helpers";

const setup = async (dir: string) => {
  // Features without a changes.patch are not loaded, so seed a placeholder.
  await writeFile(join(dir, "demo", "features", "hello", "changes.patch"), "");
  const { projects } = await loadProjects(dir);
  const project = findProject(projects, "demo");
  const feature = findFeature(project, "hello");
  const fromDir = workDirFor(join(dir, ".."), project, feature);
  await prepare({ project, outDir: fromDir, install: false, force: false });
  await git(["checkout", "-q", "-b", `feature/${feature.slug}`], fromDir);
  return { feature, fromDir };
};

test("regen writes main..HEAD as changes.patch", async () => {
  await withTempFixtures(async (dir) => {
    const { feature, fromDir } = await setup(dir);
    const file = join(fromDir, "src", "index.ts");
    await writeFile(
      file,
      `${await readFile(file, "utf8")}export const added = 1;\n`,
    );
    await commitAll(fromDir, "Add constant");
    const result = await regen({ feature, fromDir });
    assert.equal(result.patchPath, feature.patchPath);
    assert.equal(result.filesChanged, 1);
    const patch = await readFile(feature.patchPath, "utf8");
    assert.match(patch, /diff --git a\/src\/index\.ts/);
    assert.match(patch, /\+export const added = 1;/);
    assert.ok(patch.endsWith("\n"));
  });
});

test("regen refuses when HEAD equals main", async () => {
  await withTempFixtures(async (dir) => {
    const { feature, fromDir } = await setup(dir);
    await assert.rejects(regen({ feature, fromDir }), /No changes/);
  });
});
