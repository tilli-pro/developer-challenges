/**
 * The version compare challenge.
 *
 * Write a comparator for semantic version strings so that
 * `versions.sort(compareVersions)` orders them oldest to newest. Return a
 * negative number if `a` is older than `b`, positive if newer, 0 if equal.
 *
 * The rules:
 *   - Compare major, then minor, then patch, as numbers. "1.10.0" is newer
 *     than "1.9.2" even though it sorts first as a string.
 *   - A version with a prerelease suffix ("2.0.0-beta") is older than the
 *     same version without one ("2.0.0").
 *   - Prerelease suffixes compare dot-separated segment by segment:
 *     numeric segments compare as numbers, anything else compares as text,
 *     and a shorter list of segments is older when all shared segments tie.
 *     So "beta" < "beta.2" < "beta.10" < "rc.1".
 *
 * Examples:
 *   compareVersions("1.9.2", "1.10.0")        -> negative
 *   compareVersions("2.0.0", "2.0.0-beta")    -> positive
 *   compareVersions("1.0.0", "1.0.0")         -> 0
 *   ["2.0.0", "1.10.0", "1.9.2", "2.0.0-rc.1"].sort(compareVersions)
 *     -> ["1.9.2", "1.10.0", "2.0.0-rc.1", "2.0.0"]
 *
 * @param a The first version.
 * @param b The second version.
 */
const compareVersions = (a: string, b: string): number => {
  return 0;
};

export const main = (versions: string[]) => {
  console.log("Versions:", versions);
  console.log("Sorted:\n", [...versions].sort(compareVersions));
};
