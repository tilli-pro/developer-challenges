import { DateTime } from "./init";

export type Person = { name: string; zone: string };

/** A candidate meeting time and how it reads on each person's clock. */
export type Slot = { startUtc: string; local: Record<string, string> };

/**
 * The meeting slots challenge.
 *
 * For each weekday (Monday to Friday) of the week starting on `weekStart`,
 * build every person's working-hours interval in their own timezone with
 * `DateTime.fromISO(day, { zone })`, intersect all of those intervals with
 * luxon's `Interval.intersection` (both are exported from ./init), and emit every meeting of
 * `durationMinutes` that starts on the hour and fits inside the intersection.
 *
 * Each slot reports `startUtc` as an ISO instant and `local` as each
 * person's local time formatted like "14:00 GMT" (luxon format "HH:mm ZZZZ").
 *
 * Example with Ada in Europe/London, Ben in Europe/Berlin, Cara in
 * America/New_York, hours 9-17 and 60 minutes: everyone is working between
 * 14:00 and 17:00 London time (15:00 Berlin, 09:00 New York), so each
 * weekday yields two slots starting at 14:00 and 15:00 London:
 *
 *   {
 *     startUtc: "2026-11-02T14:00:00.000Z",
 *     local: { Ada: "14:00 GMT", Ben: "15:00 GMT+1", Cara: "09:00 EST" },
 *   }
 *
 * Add someone in Asia/Tokyo and there are no slots at all.
 *
 * @param people Everyone who has to attend, with their IANA timezone.
 * @param weekStart The Monday of the week, as YYYY-MM-DD.
 * @param workingHours Local [start, end] hours, e.g. [9, 17].
 * @param durationMinutes The meeting length.
 */
const findSlots = (
  people: Person[],
  weekStart: string,
  workingHours: [number, number],
  durationMinutes: number,
): Slot[] => {
  return [];
};

export const main = (
  people: Person[],
  weekStart: string,
  workingHours: [number, number],
  durationMinutes: number,
) => {
  console.log("People:", people);
  for (const { name, zone } of people) {
    if (!DateTime.now().setZone(zone).isValid) {
      console.warn(`  Warning: "${zone}" (${name}) is not a valid IANA zone.`);
    }
  }
  const monday = DateTime.fromISO(weekStart, { zone: "utc" });
  console.log(
    "Week:",
    `${monday.toFormat("ccc d LLL")} to ${monday.plus({ days: 4 }).toFormat("ccc d LLL yyyy")}`,
  );
  console.log("Working hours:", `${workingHours[0]}:00-${workingHours[1]}:00`);
  console.log("Duration:", `${durationMinutes} minutes`);

  const slots = findSlots(people, weekStart, workingHours, durationMinutes);
  if (slots.length === 0) {
    console.log(
      "\nNo common slots. Try widening --hours or dropping a timezone.",
    );
    return;
  }

  let lastDay = "";
  for (const slot of slots) {
    const day = slot.startUtc.slice(0, 10);
    if (day !== lastDay) {
      console.log(`\n${day}`);
      lastDay = day;
    }
    const locals = Object.entries(slot.local)
      .map(([name, time]) => `${name} ${time}`)
      .join("  ");
    console.log(`  ${slot.startUtc}  ${locals}`);
  }
  console.log(`\n${slots.length} slot(s) found`);
};
