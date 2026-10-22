import { describeRule, parseRule } from "./init";

/**
 * The recurring dates challenge.
 *
 * Given an iCalendar recurrence rule (the RRULE part of a calendar event,
 * e.g. "FREQ=MONTHLY;BYDAY=2TU" for "the second Tuesday of every month"),
 * return the first `count` occurrences on or after `from`, formatted for the
 * given locale.
 *
 * Use `parseRule(rule, dtstart)` from ./init to build the rule. Treat `from`
 * (a YYYY-MM-DD string) as midnight UTC. Format each occurrence with
 *
 *   new Intl.DateTimeFormat(locale, {
 *     weekday: "long", day: "numeric", month: "long", year: "numeric",
 *     timeZone: "UTC",
 *   })
 *
 * Why UTC? The rrule library treats dates as "floating" calendar dates with
 * no time zone: it does its arithmetic in UTC and hands back UTC `Date`s. If
 * you format one of those in a local zone west of Greenwich, midnight UTC is
 * still the previous evening and every date comes out one day early. Pinning
 * `timeZone: "UTC"` keeps the calendar day the rule meant.
 *
 * Example:
 *   nextOccurrences("FREQ=MONTHLY;BYDAY=2TU", "2026-10-16", 3, "en-GB") -> [
 *     "Tuesday, 10 November 2026",
 *     "Tuesday, 8 December 2026",
 *     "Tuesday, 12 January 2027",
 *   ]
 *
 * @param rule The RRULE string.
 * @param from The start date, YYYY-MM-DD, inclusive.
 * @param count How many occurrences to return.
 * @param locale The BCP 47 locale tag to format with.
 */
const nextOccurrences = (
  rule: string,
  from: string,
  count: number,
  locale: string,
): string[] => {
  return [];
};

export const main = (
  rule: string,
  from: string,
  count: number,
  locale: string,
) => {
  const dtstart = new Date(`${from}T00:00:00Z`);
  console.log("Rule:", rule);
  console.log("In words:", describeRule(parseRule(rule, dtstart)));
  console.log("From:", from, `(${locale})`);
  console.log(
    `Next ${count} occurrences:\n`,
    nextOccurrences(rule, from, count, locale),
  );
};
