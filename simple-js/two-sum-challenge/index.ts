import type { Arg, Tags } from "../types";
import { randomInt, shuffle } from "../utils";

export const main = async (prices: string, args: { budget: number }) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    const parsedPrices = prices.split(",").map((p) => Number(p.trim()));
    await challengeModule.main(parsedPrices, Number(args.budget));
  }
};

export const description =
  "Find two prices in a list that add up to a given budget.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["arrays", "hashing"],
  minutes: 15,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[prices]",
    description: "Comma-separated list of item prices.",
    defaultValue: () => {
      const prices = Array.from({ length: 5 }, () => randomInt(1, 19));
      // Plant a matching pair for the default budget of 20 most of the time.
      if (Math.random() < 0.75) {
        const a = randomInt(1, 19);
        prices.push(a, 20 - a);
      }
      return shuffle(prices).join(",");
    },
  },
  {
    type: "flag",
    flag: "--budget, -b [NUM]",
    description: "The exact amount the two prices must sum to.",
    defaultValue: 20,
  },
] as const;
