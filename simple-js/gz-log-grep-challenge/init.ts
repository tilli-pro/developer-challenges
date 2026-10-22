import fg from "fast-glob";

/** Absolute paths of every `*.log.gz` file under `dir`, nested folders included. */
export const findLogFiles = (dir: string): Promise<string[]> =>
  fg("**/*.log.gz", { cwd: dir, absolute: true });
