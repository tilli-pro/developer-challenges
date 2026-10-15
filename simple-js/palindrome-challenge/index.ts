import type { Arg } from "../types";
import { pick } from "../utils";

export const main = async (testString: string) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(testString);
  }
};

export const description =
  "Determine whether a string reads the same forwards and backwards, ignoring case and punctuation.\n";
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[test-string]",
    description: "The string to check.",
    defaultValue: () =>
      pick([
        "A man, a plan, a canal: Panama",
        "racecar",
        "hello",
        "Was it a car or a cat I saw?",
        "almost omla",
      ]),
  },
] as const;
