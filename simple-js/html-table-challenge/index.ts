import { join } from "node:path";
import type { Arg, Tags } from "../types";

export const main = async (
  file: string,
  args: { base: string; selector: string },
) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(file, args.selector, args.base);
  }
};

export const description =
  "Extract a pricing table from an HTML page into JSON, resolving relative links to absolute URLs.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["html", "parsing", "urls", "files"],
  minutes: 15,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[file]",
    description:
      "Path to an HTML file. Defaults to the pricing.html bundled with the challenge.",
    defaultValue: () => join(import.meta.dirname, "pricing.html"),
  },
  {
    type: "flag",
    flag: "--base, -b [URL]",
    description: "The URL the page was loaded from, used to resolve links.",
    defaultValue: "https://example.com/pricing/",
  },
  {
    type: "flag",
    flag: "--selector, -s [CSS]",
    description: "CSS selector for the table to extract.",
    defaultValue: "table.plans",
  },
] as const;
