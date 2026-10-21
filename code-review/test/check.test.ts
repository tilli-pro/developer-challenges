import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { checkFeature } from "../lib/check";
import { commitAll, git } from "../lib/git";
import { prepare } from "../lib/prepare";
import { findFeature, findProject, loadProjects } from "../lib/projects";
import { regen } from "../lib/regen";
import { withTempFixtures } from "./helpers";

/** Builds a real changes.patch for demo/hello by editing a scratch work dir. */
const setup = async (dir: string, edit: (workDir: string) => Promise<void>) => {
  const patchPath = join(dir, "demo", "features", "hello", "changes.patch");
  await writeFile(patchPath, "");
  const seeded = findProject((await loadProjects(dir)).projects, "demo");
  const seededFeature = findFeature(seeded, "hello");
  const workDir = join(dir, "..", "scratch");
  await prepare({
    project: seeded,
    outDir: workDir,
    install: false,
    force: false,
  });
  await git(["checkout", "-q", "-b", "feature/hello"], workDir);
  await edit(workDir);
  await commitAll(workDir, "Edit");
  await regen({ feature: seededFeature, fromDir: workDir });
  const project = findProject((await loadProjects(dir)).projects, "demo");
  return { project, feature: findFeature(project, "hello") };
};

const addConstant = async (workDir: string) => {
  const file = join(workDir, "src", "index.ts");
  await writeFile(
    file,
    `${await readFile(file, "utf8")}export const added = 1;\n`,
  );
};

test("checkFeature reports all green for a clean patch", async () => {
  await withTempFixtures(async (dir) => {
    const { project, feature } = await setup(dir, addConstant);
    const tmpRoot = join(dir, "..", "tmp");
    const row = await checkFeature(project, feature, tmpRoot);
    assert.deepEqual(row, {
      project: "demo",
      feature: "hello",
      applies: true,
      baseTypecheck: true,
      baseTest: true,
      featureTypecheck: true,
      featureTest: true,
    });
    assert.equal(existsSync(join(tmpRoot, "demo-hello")), false);
  });
});

test("checkFeature reports applies=false with an error for a broken patch", async () => {
  await withTempFixtures(async (dir) => {
    const { project, feature } = await setup(dir, addConstant);
    await writeFile(feature.patchPath, "this is not a patch\n");
    const tmpRoot = join(dir, "..", "tmp");
    const row = await checkFeature(project, feature, tmpRoot);
    assert.equal(row.applies, false);
    assert.ok(row.error && row.error.length > 0);
    assert.equal(row.baseTypecheck, false);
    assert.equal(row.baseTest, false);
    assert.equal(row.featureTypecheck, false);
    assert.equal(row.featureTest, false);
    assert.equal(existsSync(join(tmpRoot, "demo-hello")), false);
  });
});

test("checkFeature reports featureTest=false when the patch makes test exit 1", async () => {
  await withTempFixtures(async (dir) => {
    const { project, feature } = await setup(dir, async (workDir) => {
      const file = join(workDir, "package.json");
      const pkg = JSON.parse(await readFile(file, "utf8"));
      pkg.scripts.test = 'node -e "process.exit(1)"';
      await writeFile(file, `${JSON.stringify(pkg, null, 2)}\n`);
    });
    const row = await checkFeature(project, feature, join(dir, "..", "tmp"));
    assert.equal(row.applies, true);
    assert.equal(row.baseTest, true);
    assert.equal(row.featureTypecheck, true);
    assert.equal(row.featureTest, false);
  });
});

test("checkFeature reports a failed checkout as an error row", async () => {
  await withTempFixtures(async (dir) => {
    // The base typecheck dirties a file the patch also edits, so switching to
    // the feature branch fails.
    const basePackage = join(dir, "demo", "base", "package.json");
    const pkg = JSON.parse(await readFile(basePackage, "utf8"));
    pkg.scripts.typecheck =
      "node -e \"require('node:fs').appendFileSync('src/index.ts', '// dirty\\\\n')\"";
    await writeFile(basePackage, JSON.stringify(pkg, null, 2));
    const { project, feature } = await setup(dir, addConstant);
    const row = await checkFeature(project, feature, join(dir, "..", "tmp"));
    assert.equal(row.applies, true);
    assert.ok(row.error && row.error.length > 0);
    assert.equal(row.baseTypecheck, true);
    assert.equal(row.baseTest, true);
    assert.equal(row.featureTypecheck, false);
    assert.equal(row.featureTest, false);
  });
});
