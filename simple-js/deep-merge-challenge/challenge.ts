export type PlainObject = Record<string, unknown>;

/**
 * The deep merge challenge.
 *
 * Merge `override` into `base` the way a config loader layers a user's
 * settings over the defaults. Return a new object; do not mutate either
 * input. The rules:
 *   - When both sides hold a plain object at the same key, merge those
 *     recursively.
 *   - Otherwise the override value wins. This includes arrays (replaced,
 *     not concatenated) and `null`.
 *   - Keys whose override value is `undefined` are skipped, so the base
 *     value stays.
 *
 * Examples:
 *   deepMerge({ a: 1, b: { c: 2, d: 3 } }, { b: { c: 9 } })
 *     -> { a: 1, b: { c: 9, d: 3 } }
 *   deepMerge({ list: [1, 2] }, { list: [3] })  -> { list: [3] }
 *   deepMerge({ log: { level: "info" } }, { log: null }) -> { log: null }
 *   deepMerge({ a: 1 }, { a: undefined })       -> { a: 1 }
 *
 * @param base The defaults.
 * @param override The values to layer on top.
 */
const deepMerge = (base: PlainObject, override: PlainObject): PlainObject => {
  return {};
};

export const main = (base: PlainObject, override: PlainObject) => {
  console.log("Defaults:", JSON.stringify(base, null, 2));
  console.log("Overrides:", JSON.stringify(override, null, 2));
  console.log("Merged:\n", JSON.stringify(deepMerge(base, override), null, 2));
};
