import type { Arg, Tags } from "../types";
import { pick } from "../utils";

export const main = async (a: string, args: { other: string }) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(JSON.parse(a), JSON.parse(args.other));
  }
};

export const description =
  "Decide whether two values are structurally equal, recursing into nested objects and arrays.\n";
export const tags: Tags = {
  difficulty: "medium",
  topics: ["objects", "recursion"],
  minutes: 25,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[a]",
    description: "The first value, in JSON format.",
    defaultValue:
      '{"user":{"name":"Ada","tags":["math","code"]},"count":1,"active":true}',
  },
  {
    type: "flag",
    flag: "--other, -o [JSON]",
    description: "The second value to compare against, in JSON format.",
    defaultValue: () =>
      pick([
        // Same content, keys in a different order: equal.
        '{"active":true,"count":1,"user":{"tags":["math","code"],"name":"Ada"}}',
        // Array order differs: not equal.
        '{"user":{"name":"Ada","tags":["code","math"]},"count":1,"active":true}',
        // Number versus string: not equal.
        '{"user":{"name":"Ada","tags":["math","code"]},"count":"1","active":true}',
        // Extra nested key: not equal.
        '{"user":{"name":"Ada","tags":["math","code"],"id":7},"count":1,"active":true}',
        // Missing key: not equal.
        '{"user":{"name":"Ada","tags":["math","code"]},"count":1}',
        // Null where an object was: not equal.
        '{"user":null,"count":1,"active":true}',
      ]),
  },
] as const;
