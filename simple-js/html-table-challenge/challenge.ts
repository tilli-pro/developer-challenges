import { load } from "./init";

/**
 * The HTML table challenge.
 *
 * Read the HTML file at `filePath`, find the table matching `selector`, and
 * return one object per body row, keyed by the header cell texts.
 *
 * Rules:
 *   - Keys come from the `<th>` cells in the table's `<thead>`.
 *   - A cell's value is its text with surrounding whitespace trimmed and any
 *     run of inner whitespace collapsed to a single space, so nested markup
 *     such as <strong>Pro</strong> <span class="badge">Popular</span>
 *     becomes "Pro Popular".
 *   - A cell containing an <a> yields the link's absolute URL instead of its
 *     text, resolved against `baseUrl` with `new URL(href, baseUrl)`.
 *
 * Example (for the bundled pricing.html with the default base):
 *   extractTable(file, "table.plans", "https://example.com/pricing/") -> [
 *     { Plan: "Free", Price: "$0 /mo", Storage: "1 GB",
 *       Link: "https://example.com/signup?plan=free" },
 *     { Plan: "Pro Popular", Price: "$12 /mo", ... },
 *     ...
 *   ]
 *
 * Use the `load` helper from ./init to parse the HTML.
 *
 * @param filePath Path to the HTML file.
 * @param selector CSS selector for the table.
 * @param baseUrl The page's URL, used to resolve relative links.
 */
const extractTable = async (
  filePath: string,
  selector: string,
  baseUrl: string,
): Promise<Record<string, string>[]> => {
  return [];
};

export const main = async (
  filePath: string,
  selector: string,
  baseUrl: string,
) => {
  console.log("File:", filePath);
  console.log("Selector:", selector);
  console.log("Base URL:", baseUrl);
  const rows = await extractTable(filePath, selector, baseUrl);
  console.log("Rows:\n", JSON.stringify(rows, null, 2));
};
