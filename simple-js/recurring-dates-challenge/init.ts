import type { RRule } from "rrule";
import rrule from "rrule";

export type { RRule } from "rrule";

// rrule ships a UMD bundle as its CommonJS entry, so Node cannot see its
// named exports from ESM; pull them off the default export instead.
const { RRule: RRuleClass } = rrule;

/**
 * Parses an iCalendar RRULE string such as "FREQ=MONTHLY;BYDAY=2TU" into a
 * rule that starts at `dtstart`.
 *
 * rrule treats dates as "floating": it does its arithmetic in UTC and the
 * occurrences it returns are UTC `Date`s. Pass a UTC midnight `dtstart` and
 * format the results with `timeZone: "UTC"` to get the calendar days you
 * expect.
 */
export const parseRule = (rule: string, dtstart: Date): RRule => {
  const parsed = RRuleClass.fromString(rule);
  return new RRuleClass({ ...parsed.origOptions, dtstart });
};

/** The rule in words, e.g. "every month on the 2nd Tuesday". */
export const describeRule = (rule: RRule): string => rule.toText();
