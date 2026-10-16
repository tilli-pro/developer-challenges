/**
 * The memoize challenge.
 *
 * Wrap `fn` so that calling the wrapper with arguments it has seen before
 * returns the previously computed result without calling `fn` again. The
 * first call with a given set of arguments calls `fn` and remembers the
 * result.
 *
 * Two calls are "the same" when `keyFn(...args)` returns the same string.
 * When no `keyFn` is given, use `JSON.stringify(args)`.
 *
 * Example:
 *   let calls = 0;
 *   const square = memoize((n: number) => { calls++; return n * n; });
 *   square(4); // 16, calls === 1
 *   square(4); // 16, calls === 1 (cached)
 *   square(5); // 25, calls === 2
 *
 * @param fn The function to wrap.
 * @param keyFn Optional function that turns the arguments into a cache key.
 */
const memoize = <Args extends unknown[], R>(
  fn: (...args: Args) => R,
  keyFn?: (...args: Args) => string,
): ((...args: Args) => R) => {
  return fn;
};

export const main = (inputs: number[]) => {
  console.log("Inputs:", inputs);

  let computations = 0;
  const square = (n: number) => {
    computations++;
    console.log(`  computing square(${n})`);
    return n * n;
  };
  const memoizedSquare = memoize(square);

  const results = inputs.map((n) => memoizedSquare(n));
  console.log("Results:", results);
  console.log(
    `Cache hits: ${inputs.length - computations} of ${inputs.length} calls (${computations} real computations)`,
  );
};
