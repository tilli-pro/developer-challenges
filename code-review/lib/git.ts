import { execFile } from "node:child_process";

let baseEnv: NodeJS.ProcessEnv | undefined;

/** Replaces the base environment git calls start from. Pass undefined to go back to `process.env`. */
export const setGitEnvForTests = (overrides: NodeJS.ProcessEnv | undefined) => {
  baseEnv = overrides;
};

/**
 * The environment every git call runs with: the base environment without any
 * `GIT_AUTHOR_*` or `GIT_COMMITTER_*` variables, and with the global and system
 * git config hidden, so the user's signing, hooks and identity never apply.
 */
const gitEnv = (): NodeJS.ProcessEnv => ({
  ...Object.fromEntries(
    Object.entries(baseEnv ?? process.env).filter(
      ([key]) => !/^GIT_(AUTHOR|COMMITTER)_/.test(key),
    ),
  ),
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
});

/** Runs git in `cwd` and resolves its stdout untouched. Rejects with git's stderr as the message. */
export const gitRaw = (args: string[], cwd: string): Promise<string> =>
  new Promise((resolve, reject) => {
    execFile(
      "git",
      args,
      { cwd, env: gitEnv(), maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr.trim() || error.message));
          return;
        }
        resolve(stdout);
      },
    );
  });

/** Runs git in `cwd` and resolves its trimmed stdout. */
export const git = async (args: string[], cwd: string): Promise<string> =>
  (await gitRaw(args, cwd)).trim();

/** Stages everything and commits it with a fixed identity, so no git config is needed. */
export const commitAll = async (
  cwd: string,
  subject: string,
  body?: string,
): Promise<void> => {
  await git(["add", "-A"], cwd);
  const messages = body ? ["-m", subject, "-m", body] : ["-m", subject];
  await git(
    [
      "-c",
      "user.name=Code Review",
      "-c",
      "user.email=code-review@localhost",
      "commit",
      "-q",
      ...messages,
    ],
    cwd,
  );
};
