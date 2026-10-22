import { headings } from "./init";

/** Opening and closing markers the table of contents is written between. */
export const TOC_START = "<!-- toc -->";
export const TOC_END = "<!-- /toc -->";

/**
 * The markdown TOC challenge.
 *
 * Read the markdown file at `filePath` and return the whole document with a
 * table of contents inserted between the `<!-- toc -->` and `<!-- /toc -->`
 * markers, replacing whatever is currently between them.
 *
 * Use the `headings` helper from ./init to find the headings. Only headings
 * from depth 2 up to `maxDepth` are listed (the H1 is the document title).
 * Each entry is a markdown list item linking to the heading's anchor, and is
 * indented two spaces for every level below 2:
 *
 *   - [Install](#install)
 *   - [Usage](#usage)
 *     - [Examples](#examples)
 *     - [Examples](#examples-1)
 *
 * Anchors follow GitHub's slug rules: lowercase the text, drop every character
 * that is not a letter, number, space or hyphen, turn spaces into hyphens, and
 * give repeated slugs a `-1`, `-2`, ... suffix in order of appearance. The
 * backticks in a heading such as "Using `pnpm sj` (CLI)" are therefore
 * dropped, giving "using-pnpm-sj-cli", while the link text keeps them.
 *
 * @param filePath Path to the markdown file.
 * @param maxDepth The deepest heading level to include.
 */
const buildToc = async (
  filePath: string,
  maxDepth: number,
): Promise<string> => {
  return "";
};

export const main = async (filePath: string, maxDepth = 3, write = false) => {
  console.log("File:", filePath);
  console.log("Max depth:", maxDepth);
  const result = await buildToc(filePath, maxDepth);
  const start = result.indexOf(TOC_START);
  const end = result.indexOf(TOC_END);
  if (start === -1 || end === -1) {
    console.log("Result contains no TOC markers:\n", result);
    return;
  }
  console.log("TOC section:\n");
  console.log(result.slice(start, end + TOC_END.length));
  if (write) {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(filePath, result);
    console.log("\nWritten back to", filePath);
  }
};
