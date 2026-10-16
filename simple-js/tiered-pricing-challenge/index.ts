import type { Arg, Tags } from "../types";
import { randomInt } from "../utils";
import type { Tier } from "./challenge";

const parseTiers = (tiers: string): Tier[] =>
  tiers.split(",").map((entry) => {
    const [size, rate] = entry.trim().split(":");
    return {
      size: size === "*" ? null : Number(size),
      rate: Number(rate),
    };
  });

export const main = async (units: string, args: { tiers: string }) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(Number(units), parseTiers(args.tiers));
  }
};

export const description =
  "Bill a usage amount against pricing tiers, such as the first 100 units at one rate and the rest at another.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["math", "arrays", "money"],
  minutes: 15,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[units]",
    description: "How many units were used.",
    defaultValue: () => String(randomInt(50, 1200)),
  },
  {
    type: "flag",
    flag: "--tiers, -t [TIERS]",
    description:
      'Comma-separated size:rate tiers in order. "*" is an unbounded final tier.',
    defaultValue: "100:0.10,400:0.08,*:0.05",
  },
] as const;
