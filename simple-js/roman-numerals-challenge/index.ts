import type { Arg, Tags } from "../types";
import { randomInt } from "../utils";

export const main = async (num: string) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(Number(num));
  }
};

export const description =
  "Convert an integer to its Roman numeral representation.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["math", "strings", "lookup-table"],
  minutes: 20,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[number]",
    description: "The integer to convert (1-3999).",
    defaultValue: () => String(randomInt(1, 3999)),
  },
] as const;
