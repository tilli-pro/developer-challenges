import { join } from "node:path";
import type { Arg, Tags } from "../types";

export const main = async (configPath: string, args: { env: string }) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(configPath, args.env);
  }
};

export const description =
  "Load a JSON config and an env file, apply env overrides, validate with a schema and print readable errors.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["validation", "config", "files", "env"],
  minutes: 20,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[config]",
    description: "Path to the base JSON config file.",
    defaultValue: () => join(import.meta.dirname, "config.json"),
  },
  {
    type: "flag",
    flag: "--env, -e [FILE]",
    description:
      "Path to an env file whose KEY=VALUE lines override the JSON. Try bad.env.",
    defaultValue: () => join(import.meta.dirname, "sample.env"),
  },
] as const;
