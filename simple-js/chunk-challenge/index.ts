import type { Arg } from "../types";
import { randomInt } from "../utils";

export const main = async (items: string, args: { size: number }) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    const parsedItems = items.split(",").map((i) => Number(i.trim()));
    await challengeModule.main(parsedItems, Number(args.size));
  }
};

export const description =
  "Split a list into consecutive groups of a given size.\n";
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[items]",
    description: "Comma-separated list of numbers to split up.",
    defaultValue: () =>
      Array.from({ length: randomInt(5, 10) }, (_, i) => i + 1).join(","),
  },
  {
    type: "flag",
    flag: "--size, -s [NUM]",
    description: "The maximum number of items per group.",
    defaultValue: 3,
  },
] as const;
