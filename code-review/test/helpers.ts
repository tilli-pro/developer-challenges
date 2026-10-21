import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setGitEnvForTests } from "../lib/git";

export const fixturesDir = join(import.meta.dirname, "fixtures", "projects");

/** Environment that hides the machine's global and system git config. */
const inherited = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) => !/^GIT_(AUTHOR|COMMITTER)_/.test(key),
  ),
);

export const gitEnv = {
  ...inherited,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
};

setGitEnvForTests(gitEnv);

/** Runs `fn` with a temp copy of the fixture projects, removed afterwards. */
export const withTempFixtures = async (fn: (dir: string) => Promise<void>) => {
  const dir = await mkdtemp(join(tmpdir(), "cr-test-"));
  try {
    await cp(fixturesDir, join(dir, "projects"), { recursive: true });
    await fn(join(dir, "projects"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};
