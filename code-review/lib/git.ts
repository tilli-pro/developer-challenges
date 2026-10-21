import { execFile } from "node:child_process";

let env: NodeJS.ProcessEnv = process.env;

/** Replaces the environment every git call runs with. Tests use it to ignore the machine's git config. */
export const setGitEnvForTests = (overrides: NodeJS.ProcessEnv) => {
  env = overrides;
};

/** Runs git in `cwd` and resolves its trimmed stdout. Rejects with git's stderr as the message. */
export const git = (args: string[], cwd: string): Promise<string> =>
  new Promise((resolve, reject) => {
    execFile("git", args, { cwd, env }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr.trim() || error.message));
        return;
      }
      resolve(stdout.trim());
    });
  });

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
      "user.email=code-review@example.com",
      "commit",
      "-q",
      ...messages,
    ],
    cwd,
  );
};
