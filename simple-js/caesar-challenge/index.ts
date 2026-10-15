import type { Arg, Tags } from "../types";
import { pick } from "../utils";

export const main = async (message: string, args: { shift: number }) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(message, Number(args.shift));
  }
};

export const description =
  "Encode a message by shifting each letter a fixed number of places in the alphabet.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["strings", "math"],
  minutes: 15,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[message]",
    description: "The text to encode.",
    defaultValue: () =>
      pick(["Hello, World!", "xyz", "Attack at dawn.", "The Quick Brown Fox"]),
  },
  {
    type: "flag",
    flag: "--shift, -s [NUM]",
    description: "How many places to shift each letter.",
    defaultValue: 3,
  },
] as const;
