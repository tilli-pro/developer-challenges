import type { Arg, Tags } from "../types";
import { randomInt, sample, shuffle } from "../utils";

export const main = async (versions: string) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    const parsedVersions = versions.split(",").map((v) => v.trim());
    await challengeModule.main(parsedVersions);
  }
};

export const description =
  "Sort semantic version strings correctly, so 1.10.0 comes after 1.9.2 and prereleases come before releases.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["strings", "comparators", "sorting"],
  minutes: 15,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[versions]",
    description: "Comma-separated list of semantic versions to sort.",
    defaultValue: () => {
      // Always include the pair that breaks a plain string sort.
      const always = ["1.9.2", "1.10.0"];
      const extras = [
        "0.9.0",
        "1.0.0",
        "1.0.0-rc.1",
        "1.0.1",
        "2.0.0-alpha",
        "2.0.0-beta",
        "2.0.0-beta.2",
        "2.0.0-beta.10",
        "2.0.0",
      ];
      return shuffle([...always, ...sample(extras, randomInt(3, 5))]).join(",");
    },
  },
] as const;
