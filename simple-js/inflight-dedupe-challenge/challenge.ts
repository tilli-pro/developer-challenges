import { setTimeout as sleep } from "node:timers/promises";
import { randomInt } from "../utils";

/** Something that loads a value for a key, e.g. a `fetch` wrapper. */
export type Fetcher<T> = (key: string) => Promise<T>;

/**
 * The in-flight dedupe challenge.
 *
 * Wrap `fetcher` so that while a request for a key is still pending, any
 * further calls with the same key return that same pending promise instead
 * of starting another request. Once the request settles, whether it
 * resolves or rejects, forget it, so the next call for that key starts a
 * fresh request.
 *
 * This is request coalescing, not a cache: completed results are never
 * reused. Think of ten components mounting at once that all ask for the
 * current user. You want one network call, not ten, but you still want a
 * fresh call a minute later.
 *
 * Example:
 *   const get = dedupe(fetchUser);
 *   const [a, b] = await Promise.all([get("user:1"), get("user:1")]);
 *   // fetchUser was called once; a === b
 *   await get("user:1");
 *   // fetchUser was called again, the first request had already settled
 *
 * @param fetcher The underlying async function to wrap.
 */
const dedupe = <T>(fetcher: Fetcher<T>): Fetcher<T> => {
  return fetcher;
};

export const main = async (keys: string[]) => {
  console.log("Keys:", keys);
  const distinct = new Set(keys).size;

  // A fake backend that logs each real call and takes a little while.
  let fetches = 0;
  const fetchFromBackend: Fetcher<{ key: string; fetchedAt: number }> = async (
    key,
  ) => {
    fetches++;
    console.log(`  fetching ${key}`);
    await sleep(randomInt(50, 150));
    return { key, fetchedAt: Date.now() };
  };
  const get = dedupe(fetchFromBackend);

  console.log("\nRound 1: all keys requested at once");
  const results = await Promise.all(keys.map((key) => get(key)));
  console.log("Results:", results);
  console.log(
    `Calls: ${keys.length}, real fetches: ${fetches}, distinct keys: ${distinct}`,
  );

  console.log("\nRound 2: same keys again, after round 1 finished");
  const before = fetches;
  await Promise.all(keys.map((key) => get(key)));
  console.log(
    `Calls: ${keys.length}, real fetches: ${fetches - before}, distinct keys: ${distinct}`,
  );
  console.log("(round 2 should fetch again: this is coalescing, not caching)");
};
