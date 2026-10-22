import type { Arg, Tags } from "../types";

export const main = async (
  url: string,
  args: {
    failures: number;
    retries: number;
    timeout: number;
    retryAfter: number;
  },
) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(url, {
      failures: Number(args.failures),
      retries: Number(args.retries),
      timeoutMs: Number(args.timeout),
      retryAfterSeconds: Number(args.retryAfter),
    });
  }
};

export const description =
  "A fetch wrapper that retries on 503 and 429, honours Retry-After, times out each attempt, and is proven against a mocked origin.\n";
export const tags: Tags = {
  difficulty: "medium",
  topics: ["http", "async", "retries", "mocking"],
  minutes: 25,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[url]",
    description:
      "The URL to fetch. It is served by an in-process mock, never the network.",
    defaultValue: "https://api.example.com/orders/42",
  },
  {
    type: "flag",
    flag: "--failures, -f [NUM]",
    description: "How many 503 responses the mock returns before a 200.",
    defaultValue: 2,
  },
  {
    type: "flag",
    flag: "--retries, -r [NUM]",
    description: "How many extra attempts to allow after the first.",
    defaultValue: 3,
  },
  {
    type: "flag",
    flag: "--timeout, -t [MS]",
    description: "Per-attempt timeout in milliseconds.",
    defaultValue: 2000,
  },
  {
    type: "flag",
    flag: "--retry-after, -a [SECONDS]",
    description: "The Retry-After header value the mock sends with each 503.",
    defaultValue: 1,
  },
] as const;
