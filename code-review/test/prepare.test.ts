import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { commitAll, git, setGitEnvForTests } from "../lib/git";
import { prepare, workDirFor } from "../lib/prepare";
import { findFeature, findProject, loadProjects } from "../lib/projects";
import { copyDir } from "../utils";
import { gitEnv, withTempFixtures } from "./helpers";

const options = { install: false, force: false };

/** Builds a real patch with git: edit src/index.ts in a scratch repo and capture the diff. */
const writeHelloPatch = async (projectsDir: string) => {
  const demo = join(projectsDir, "demo");
  const scratch = join(projectsDir, "..", "scratch");
  await mkdir(scratch);
  await copyDir(join(demo, "base"), scratch);
  await git(["init", "-q", "-b", "main"], scratch);
  await commitAll(scratch, "base");
  const file = join(scratch, "src", "index.ts");
  await writeFile(
    file,
    `${await readFile(file, "utf8")}export const added = 1;\n`,
  );
  const patch = await git(["diff"], scratch);
  await writeFile(
    join(demo, "features", "hello", "changes.patch"),
    `${patch}\n`,
  );
};

const load = async (dir: string) => {
  const { projects } = await loadProjects(dir);
  return findProject(projects, "demo");
};

const countCommits = async (cwd: string, ref = "HEAD") =>
  Number(await git(["rev-list", "--count", ref], cwd));

test("prepare creates main with one commit from base", async () => {
  await withTempFixtures(async (dir) => {
    const project = await load(dir);
    const outDir = workDirFor(join(dir, ".."), project);
    const result = await prepare({ ...options, project, outDir });
    assert.equal(result.dir, outDir);
    assert.equal(result.featureBranch, undefined);
    assert.equal(await countCommits(outDir), 1);
    assert.equal(await git(["branch", "--show-current"], outDir), "main");
    assert.ok(existsSync(join(outDir, "src", "index.ts")));
  });
});

test("prepare refuses an existing work dir without force", async () => {
  await withTempFixtures(async (dir) => {
    const project = await load(dir);
    const outDir = workDirFor(join(dir, ".."), project);
    await prepare({ ...options, project, outDir });
    await assert.rejects(
      prepare({ ...options, project, outDir }),
      /already exists/,
    );
    await prepare({ ...options, project, outDir, force: true });
    assert.equal(await countCommits(outDir), 1);
  });
});

test("prepare with a feature applies the patch on feature/<slug>", async () => {
  await withTempFixtures(async (dir) => {
    await writeHelloPatch(dir);
    const project = await load(dir);
    const feature = findFeature(project, "hello");
    const outDir = workDirFor(join(dir, ".."), project, feature);
    const result = await prepare({ ...options, project, feature, outDir });
    assert.equal(result.featureBranch, "feature/hello");
    assert.match(result.diffStat ?? "", /src\/index\.ts/);
    assert.equal(
      await git(["branch", "--show-current"], outDir),
      "feature/hello",
    );
    assert.equal(await countCommits(outDir), 2);
    assert.equal(await countCommits(outDir, "main"), 1);
    assert.equal(
      await git(["log", "-1", "--format=%s"], outDir),
      feature.meta.title,
    );
    assert.equal(await git(["status", "--porcelain"], outDir), "");
  });
});

test("prepare removes the work dir when the patch does not apply", async () => {
  await withTempFixtures(async (dir) => {
    const patch = [
      "diff --git a/missing.ts b/missing.ts",
      "--- a/missing.ts",
      "+++ b/missing.ts",
      "@@ -1 +0,0 @@",
      "-gone",
      "",
    ].join("\n");
    await writeFile(
      join(dir, "demo", "features", "hello", "changes.patch"),
      patch,
    );
    const project = await load(dir);
    const feature = findFeature(project, "hello");
    const outDir = workDirFor(join(dir, ".."), project, feature);
    await assert.rejects(
      prepare({ ...options, project, feature, outDir }),
      (error: Error) =>
        /missing\.ts/.test(error.message) &&
        !/already exists/.test(error.message),
    );
    assert.equal(existsSync(outDir), false);
  });
});

test("prepare commits without global git identity", async () => {
  await withTempFixtures(async (dir) => {
    const project = await load(dir);
    const outDir = workDirFor(join(dir, ".."), project);
    await prepare({ ...options, project, outDir });
    assert.equal(
      await git(["log", "-1", "--format=%an <%ae>|%cn <%ce>"], outDir),
      "Code Review <code-review@localhost>|Code Review <code-review@localhost>",
    );
  });
});

test("prepare ignores the global git config (signing, hooks) from process.env", async () => {
  await withTempFixtures(async (dir) => {
    const hooks = join(dir, "..", "hooks");
    await mkdir(hooks);
    await writeFile(join(hooks, "pre-commit"), "#!/bin/sh\nexit 1\n", {
      mode: 0o755,
    });
    const globalConfig = join(dir, "..", "gitconfig");
    await writeFile(
      globalConfig,
      `[commit]\n\tgpgsign = true\n[core]\n\thooksPath = ${hooks}\n`,
    );
    const previous = process.env.GIT_CONFIG_GLOBAL;
    process.env.GIT_CONFIG_GLOBAL = globalConfig;
    setGitEnvForTests(undefined);
    try {
      const project = await load(dir);
      const outDir = workDirFor(join(dir, ".."), project);
      await prepare({ ...options, project, outDir });
      assert.equal(await countCommits(outDir), 1);
      assert.equal(await git(["log", "-1", "--format=%G?"], outDir), "N");
    } finally {
      if (previous === undefined) {
        delete process.env.GIT_CONFIG_GLOBAL;
      } else {
        process.env.GIT_CONFIG_GLOBAL = previous;
      }
      setGitEnvForTests(gitEnv);
    }
  });
});

test("prepare --force refuses to remove a directory that is not a work dir", async () => {
  await withTempFixtures(async (dir) => {
    const project = await load(dir);
    const outDir = join(dir, "..", "plain");
    await mkdir(outDir);
    await writeFile(join(outDir, "keep.txt"), "keep\n");
    await assert.rejects(
      prepare({ ...options, project, outDir, force: true }),
      /is not a prepared work dir; refusing to remove it/,
    );
    assert.ok(existsSync(join(outDir, "keep.txt")));
  });
});

test("prepare does not copy sqlite database files from the base", async () => {
  await withTempFixtures(async (dir) => {
    const base = join(dir, "demo", "base");
    for (const name of ["data.db", "data.db-wal", "data.db-shm"]) {
      await writeFile(join(base, name), "sqlite");
    }
    const project = await load(dir);
    const outDir = workDirFor(join(dir, ".."), project);
    await prepare({ ...options, project, outDir });
    assert.equal(existsSync(join(outDir, "data.db")), false);
    assert.equal(existsSync(join(outDir, "data.db-wal")), false);
    assert.equal(existsSync(join(outDir, "data.db-shm")), false);
    assert.ok(existsSync(join(outDir, "src", "index.ts")));
  });
});
