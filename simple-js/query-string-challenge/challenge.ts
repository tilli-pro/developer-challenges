export type ParsedQuery = Record<string, string | string[]>;

/**
 * The query string challenge.
 *
 * Parse a URL query string into a plain object. The rules:
 *   - A leading "?" is optional and ignored.
 *   - Pairs are separated by "&" and look like "key=value".
 *   - A key with no "=" (e.g. "debug") has the value "".
 *   - Keys and values are percent-decoded, and "+" in a value means a space.
 *   - A key that appears more than once collects its values into an array,
 *     in the order they appeared.
 *
 * Examples:
 *   parseQuery("?page=2&sort=name")      -> { page: "2", sort: "name" }
 *   parseQuery("tag=js&tag=ts&debug")    -> { tag: ["js", "ts"], debug: "" }
 *   parseQuery("q=hello+world&n=%2Fx")   -> { q: "hello world", n: "/x" }
 *
 * @param query The raw query string.
 */
const parseQuery = (query: string): ParsedQuery => {
  return {};
};

export const main = (query: string) => {
  console.log("Query:", query);
  console.log("Parsed:\n", parseQuery(query));
};
