/**
 * The relative time challenge.
 *
 * Describe `date` relative to `now` in plain English, the way a chat app or
 * a commit list does.
 *
 * Rules:
 *   - If the two are less than 45 seconds apart in either direction,
 *     return "just now".
 *   - Otherwise pick the largest unit that fits at least once, from:
 *       minute (60s), hour (60m), day (24h), week (7d),
 *       month (30 days), year (365 days)
 *     and round the amount to the nearest whole number.
 *   - Use the singular for 1 and the plural otherwise.
 *   - A past date reads "N units ago"; a future date reads "in N units".
 *
 * Examples (now = 2026-10-15T12:00:00Z):
 *   date                     -> result
 *   2026-10-15T11:59:50Z     -> "just now"
 *   2026-10-15T11:59:00Z     -> "1 minute ago"
 *   2026-10-15T11:57:00Z     -> "3 minutes ago"
 *   2026-10-15T13:30:00Z     -> "in 2 hours"       (90 minutes rounds up)
 *   2026-10-13T12:00:00Z     -> "2 days ago"
 *   2026-10-29T12:00:00Z     -> "in 2 weeks"
 *   2026-07-15T12:00:00Z     -> "3 months ago"
 *   2029-10-14T12:00:00Z     -> "in 3 years"
 *
 * @param date The timestamp to describe.
 * @param now The reference time.
 */
const relativeTime = (date: Date, now: Date): string => {
  return "";
};

export const main = (date: Date, now: Date) => {
  console.log("Date:", date.toISOString());
  console.log("Now: ", now.toISOString());
  console.log("Relative:\n", relativeTime(date, now));
};
