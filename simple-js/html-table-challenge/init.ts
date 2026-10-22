/**
 * Cheerio's `load` parses an HTML string and returns a jQuery-like `$`.
 *
 * Example:
 *   const $ = load("<ul><li>a</li><li>b</li></ul>");
 *   $("li").map((_, el) => $(el).text()).get() -> ["a", "b"]
 */
export { load } from "cheerio";
