import { findLogFiles } from "./init";

export type Match = { file: string; line: number; text: string };

/**
 * The gz log grep challenge.
 *
 * Search every gzipped log file under `dir` for lines matching `pattern` and
 * return the matches. Use `findLogFiles(dir)` to discover the files (it
 * recurses into subfolders).
 *
 * The files may be far larger than memory, so you must stream them: build a
 * pipeline of `fs.createReadStream -> zlib.createGunzip -> readline` and test
 * each line as it arrives. Never decompress a whole file into a string.
 *
 * Rules:
 *   - `pattern` is a regular expression source. Build it with the "i" flag
 *     when `ignoreCase` is true.
 *   - `file` in each match is the path relative to `dir` (e.g. "worker/worker.log.gz").
 *   - `line` is 1-based.
 *   - Return matches in file order (as given by `findLogFiles`) and then line
 *     order.
 *
 * Example (for the bundled logs, pattern "ERROR"):
 *   grepLogs("ERROR", logsDir, false) -> [
 *     { file: "app-2026-10-01.log.gz", line: 13, text: "2026-10-01T09:04:11Z ERROR user=5 POST /cart 500 712ms db connection timeout" },
 *     ...
 *   ]
 *
 * @param pattern Regular expression source to search for.
 * @param dir Folder that holds the `.log.gz` files.
 * @param ignoreCase Whether to match case-insensitively.
 */
const grepLogs = async (
  pattern: string,
  dir: string,
  ignoreCase: boolean,
): Promise<Match[]> => {
  return [];
};

export const main = async (
  pattern: string,
  dir: string,
  ignoreCase: boolean,
) => {
  console.log("Pattern:", pattern, ignoreCase ? "(ignore case)" : "");
  console.log("Dir:    ", dir);
  console.log("Files:  ", await findLogFiles(dir));
  const matches = await grepLogs(pattern, dir, ignoreCase);
  for (const { file, line, text } of matches) {
    console.log(`${file}:${line}  ${text}`);
  }
  console.log(`\n${matches.length} matching line(s)`);
};
