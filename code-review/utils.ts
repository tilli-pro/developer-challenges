import { cp } from "node:fs/promises";
import { relative, sep } from "node:path";

/** Random integer between `min` and `max`, inclusive. */
export const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/** A random element of `items`. */
export const pick = <T>(items: readonly T[]): T =>
  items[randomInt(0, items.length - 1)] as T;

/** A shuffled copy of `items`. */
export const shuffle = <T>(items: readonly T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
};

const SKIPPED_DIRS = ["node_modules", ".work"];
const SKIPPED_SUFFIXES = [".db", ".db-wal", ".db-shm"];

/** Recursively copy `src` to `dest`, skipping `node_modules`, `.work` and sqlite database files. */
export const copyDir = (src: string, dest: string): Promise<void> =>
  cp(src, dest, {
    recursive: true,
    filter: (path) => {
      const segments = relative(src, path).split(sep);
      const name = segments.at(-1) ?? "";
      return (
        !segments.some((segment) => SKIPPED_DIRS.includes(segment)) &&
        !SKIPPED_SUFFIXES.some((suffix) => name.endsWith(suffix))
      );
    },
  });
