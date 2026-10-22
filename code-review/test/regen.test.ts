import assert from "node:assert/strict";
import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { commitAll, git, gitRaw } from "../lib/git";
import { prepare, workDirFor } from "../lib/prepare";
import {
  findFeature,
  findProject,
  loadFeature,
  loadProjects,
} from "../lib/projects";
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

test("regen writes the raw diff byte for byte, keeping trailing whitespace", async () => {
  await withTempFixtures(async (dir) => {
    const { feature, fromDir } = await setup(dir);
    const file = join(fromDir, "src", "index.ts");
    await writeFile(
      file,
      `${await readFile(file, "utf8")}export const spaced = 1;   \n`,
    );
    await commitAll(fromDir, "Add constant with trailing spaces");
    await regen({ feature, fromDir });
    const raw = await gitRaw(["diff", "--binary", "main..HEAD"], fromDir);
    assert.ok(raw.endsWith("+export const spaced = 1;   \n"));
    assert.equal(await readFile(feature.patchPath, "utf8"), raw);
  });
});

test("regen refuses when HEAD equals main", async () => {
  await withTempFixtures(async (dir) => {
    const { feature, fromDir } = await setup(dir);
    await assert.rejects(regen({ feature, fromDir }), /No changes/);
  });
});

test("regen works for a feature that has no changes.patch yet", async () => {
  await withTempFixtures(async (dir) => {
    const { feature: seeded, fromDir } = await setup(dir);
    await rm(seeded.patchPath);
    const project = findProject((await loadProjects(dir)).projects, "demo");
    assert.equal(project.features.length, 0);
    const feature = await loadFeature(project.dir, "hello");
    const file = join(fromDir, "src", "index.ts");
    await writeFile(
      file,
      `${await readFile(file, "utf8")}export const added = 1;\n`,
    );
    await commitAll(fromDir, "Add constant");
    const result = await regen({ feature, fromDir });
    assert.equal(result.filesChanged, 1);
    assert.match(await readFile(feature.patchPath, "utf8"), /added = 1/);
  });
});

test("loadFeature rejects a missing feature.json", async () => {
  await withTempFixtures(async (dir) => {
    await assert.rejects(
      loadFeature(join(dir, "demo"), "nope"),
      /Unknown feature: demo\/nope/,
    );
  });
});
