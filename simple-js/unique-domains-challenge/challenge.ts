/**
 * The unique domains challenge.
 *
 * Given a list of URLs, return the distinct hostnames they point to, in the
 * order each hostname is first seen. Paths, query strings, ports and the
 * protocol should all be ignored.
 *
 * Example:
 *   uniqueDomains([
 *     "https://tilli.pro/jobs",
 *     "http://tilli.pro/about?ref=1",
 *     "https://docs.tilli.pro",
 *     "https://github.com/tilli",
 *   ]) -> ["tilli.pro", "docs.tilli.pro", "github.com"]
 *
 * @param urls The list of URLs to inspect.
 */
const uniqueDomains = (urls: string[]): string[] => {
  return [];
};

export const main = (urls: string[]) => {
  console.log("URLs:", urls);
  console.log("Unique domains:\n", uniqueDomains(urls));
};
