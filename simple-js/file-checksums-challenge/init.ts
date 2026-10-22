import fg from "fast-glob";

/** Paths of every file under `dir`, relative to it, excluding the manifest. */
export const listFiles = (dir: string): Promise<string[]> =>
  fg("**/*", { cwd: dir, onlyFiles: true, ignore: ["SHA256SUMS"] });
