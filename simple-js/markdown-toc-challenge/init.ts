import { lexer, type Tokens } from "marked";

/** A heading found in a markdown document. */
export type Heading = { depth: number; text: string };

/**
 * Lists the headings in a markdown document, in order, using marked's lexer.
 *
 * `depth` is 1 for `#`, 2 for `##`, and so on. `text` is the raw inline
 * markdown of the heading, so a heading like "## Using `pnpm sj` (CLI)" has
 * the text "Using `pnpm sj` (CLI)" with the backticks still in it.
 *
 * Headings inside fenced code blocks are not returned, because the lexer
 * knows they are code and not headings.
 *
 * @param markdown The full markdown document.
 */
export const headings = (markdown: string): Heading[] =>
  lexer(markdown)
    .filter((token): token is Tokens.Heading => token.type === "heading")
    .map((token) => ({ depth: token.depth, text: token.text }));
