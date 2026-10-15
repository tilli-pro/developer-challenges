import type { Arg } from "../types";
import { randomInt } from "../utils";

export const main = async (nested: string) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(JSON.parse(nested));
  }
};

export const description =
  "Flatten an arbitrarily nested array of numbers into a single array.\n";
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[nested]",
    description: "A nested array of numbers in JSON format.",
    defaultValue: () => {
      let next = 1;
      const build = (depth: number): unknown[] =>
        Array.from({ length: randomInt(2, 3) }, (_, i) =>
          // Always nest the first slot so the result is never flat already.
          depth > 0 && (i === 0 || Math.random() < 0.3)
            ? build(depth - 1)
            : next++,
        );
      return JSON.stringify(build(2));
    },
  },
] as const;
