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

/** `count` distinct random elements of `items`. */
export const sample = <T>(items: readonly T[], count: number): T[] =>
  shuffle(items).slice(0, count);
