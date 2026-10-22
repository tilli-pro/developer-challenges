import { listFiles } from "./init";

export type Report = {
  ok: string[];
  mismatched: string[];
  missing: string[];
  untracked: string[];
};

/**
 * The file checksums challenge.
 *
 * Verify the files under `dir` against the manifest at `manifestPath`. The
 * manifest is in the standard `sha256sum` format: one entry per line, a
 * 64-character lowercase hex digest, two spaces, then the path relative to
 * `dir`.
 *
 * For each manifest entry, hash the file with SHA-256 and classify it:
 *   - ok: the digest matches
 *   - mismatched: the file exists but its digest differs
 *   - missing: the file does not exist
 * Then use `listFiles(dir)` to find files on disk that the manifest does not
 * mention and report them as untracked.
 *
 * The files may be large, so feed `crypto.createHash("sha256")` from
 * `fs.createReadStream` rather than reading each file into memory.
 *
 * Example (for the bundled files/ folder):
 *   verifyChecksums(dir, manifest) -> {
 *     ok: ["README.txt", "app.js", "nested/config.yaml"],
 *     mismatched: ["CHANGELOG.md"],
 *     missing: ["LICENSE.txt"],
 *     untracked: ["nested/notes.txt"],
 *   }
 *
 * @param dir Folder the manifest paths are relative to.
 * @param manifestPath Path to the SHA256SUMS file.
 */
const verifyChecksums = async (
  dir: string,
  manifestPath: string,
): Promise<Report> => {
  return { ok: [], mismatched: [], missing: [], untracked: [] };
};

export const main = async (dir: string, manifestPath: string) => {
  console.log("Dir:     ", dir);
  console.log("Manifest:", manifestPath);
  console.log("On disk: ", await listFiles(dir));
  const report = await verifyChecksums(dir, manifestPath);
  for (const key of ["ok", "mismatched", "missing", "untracked"] as const) {
    console.log(`${key.padEnd(10)} ${report[key].join(", ") || "-"}`);
  }
};
