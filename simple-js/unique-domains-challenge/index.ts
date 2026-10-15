import type { Arg, Tags } from "../types";
import { randomInt, sample } from "../utils";

export const main = async (urls: string) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    const parsedUrls = urls.split(",").map((u) => u.trim());
    await challengeModule.main(parsedUrls);
  }
};

export const description = "List the distinct hostnames in a list of URLs.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["strings", "urls", "sets"],
  minutes: 15,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[urls]",
    description: "Comma-separated list of URLs.",
    defaultValue: () =>
      sample(
        [
          "https://tilli.pro/jobs",
          "http://tilli.pro/about?ref=1",
          "https://docs.tilli.pro",
          "https://github.com/tilli",
          "https://github.com/tilli/developer-challenges",
          "http://localhost:3000/health",
          "https://example.com:8443/path",
          "https://example.com",
        ],
        randomInt(4, 6),
      ).join(","),
  },
] as const;
