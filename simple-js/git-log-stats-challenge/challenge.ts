export type WeekRow = {
  /** ISO week label, e.g. "2026-W42". */
  week: string;
  /** Commits in that week across all authors. */
  total: number;
  /** Commits per author name. */
  authors: Record<string, number>;
};

/**
 * The git log stats challenge.
 *
 * Summarise the recent history of a git repository: how many commits landed
 * in each of the last `weeks` ISO weeks, and by whom.
 *
 * Run git yourself with `execFile` from `node:child_process`, promisified via
 * `node:util`. Never build a shell string with `exec`; the repo path is user
 * input. A good format to request is
 *
 *   git log --format=%H%x09%aN%x09%aI -n <maxCommits>
 *
 * which prints one commit per line as "<hash>\t<author name>\t<ISO date>".
 * `%x09` is a tab (safer than a space, since names contain spaces), `%aN`
 * applies .mailmap so one person with two emails is counted once, and `%aI`
 * is the strict ISO 8601 author date.
 *
 * Then, using the date-fns helpers exported from ./init:
 *   - keep commits on or after the start of the ISO week that is `weeks - 1`
 *     weeks before the current one (so `weeks = 1` means "this week only"),
 *   - bucket each commit by a "YYYY-Www" label built from `getISOWeekYear`
 *     and `getISOWeek` (zero-padded week number),
 *   - count commits per author within each bucket,
 *   - return the buckets newest week first.
 *
 * Example shape:
 *   [
 *     { week: "2026-W42", total: 3, authors: { "Ada Lovelace": 2, "Ben": 1 } },
 *     { week: "2026-W40", total: 1, authors: { "Ada Lovelace": 1 } },
 *   ]
 * Weeks with no commits are simply absent.
 *
 * @param repoDir Path to the repository to inspect.
 * @param weeks How many ISO weeks back to include, counting the current one.
 * @param maxCommits The most commits to read from git log.
 */
const commitStats = async (
  repoDir: string,
  weeks: number,
  maxCommits: number,
): Promise<WeekRow[]> => {
  return [];
};

export const main = async (
  repoDir: string,
  weeks: number,
  maxCommits: number,
) => {
  console.log("Repository:", repoDir);
  console.log(
    `Last ${weeks} ISO weeks, reading at most ${maxCommits} commits\n`,
  );
  const rows = await commitStats(repoDir, weeks, maxCommits);
  for (const row of rows) {
    const authors = Object.entries(row.authors)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => `${name}: ${count}`)
      .join(", ");
    console.log(`${row.week}  ${String(row.total).padStart(3)}  ${authors}`);
  }
  if (rows.length < weeks) {
    console.log(
      `\n${rows.length} of ${weeks} weeks had commits (or the history is shorter).`,
    );
  }
};
