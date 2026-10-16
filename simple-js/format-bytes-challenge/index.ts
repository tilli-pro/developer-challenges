import type { Arg, Tags } from "../types";
import { pick, randomInt } from "../utils";

export const main = async (bytes: string, args: { decimals: number }) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(Number(bytes), Number(args.decimals));
  }
};

export const description =
  "Format a byte count as a human-readable size such as '1.5 KB' or '2.3 GB'.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["math", "strings", "formatting"],
  minutes: 10,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[bytes]",
    description: "The number of bytes to format.",
    defaultValue: () =>
      String(
        pick([
          0,
          randomInt(1, 999),
          randomInt(1, 999) * 1024 ** randomInt(1, 4) + randomInt(0, 1023),
          randomInt(1, 999) * 1024 ** randomInt(1, 4) + randomInt(0, 1023),
          randomInt(1, 999) * 1024 ** randomInt(1, 4) + randomInt(0, 1023),
        ]),
      ),
  },
  {
    type: "flag",
    flag: "--decimals, -d [NUM]",
    description: "How many decimal places to show for units above bytes.",
    defaultValue: 1,
  },
] as const;
