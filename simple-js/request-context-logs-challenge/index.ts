import type { Arg, Tags } from "../types";

export const main = async (requests: string, args: { delay: number }) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(Number(requests), Number(args.delay));
  }
};

export const description =
  "Give every log line in a simulated request its request id without threading it through every function, using AsyncLocalStorage.\n";
export const tags: Tags = {
  difficulty: "medium",
  topics: ["async", "logging", "async-context", "observability"],
  minutes: 25,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[requests]",
    description: "How many simulated requests to run concurrently.",
    defaultValue: 3,
  },
  {
    type: "flag",
    flag: "--delay, -d [MS]",
    description: "Maximum random delay per step inside a request.",
    defaultValue: 50,
  },
] as const;
