import type { Arg, Tags } from "../types";
import { pick } from "../utils";

export const main = async (testString: string) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(testString);
  }
};

export const description =
  "Determine whether the brackets in a string are correctly balanced.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["strings", "stack"],
  minutes: 15,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[test-string]",
    description: "The string of brackets to check.",
    defaultValue: () =>
      pick(["{[()]}", "([)]", "a(b)c[d]", "((", "{[]}()", "{(})"]),
  },
] as const;
