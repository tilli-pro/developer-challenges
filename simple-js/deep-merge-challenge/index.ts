import type { Arg, Tags } from "../types";
import { pick } from "../utils";

export const main = async (defaults: string, args: { overrides: string }) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(
      JSON.parse(defaults),
      JSON.parse(args.overrides),
    );
  }
};

export const description =
  "Merge a config override into defaults: nested objects merge recursively, arrays and primitives are replaced.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["objects", "recursion"],
  minutes: 15,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[defaults]",
    description: "The default config, in JSON format.",
    defaultValue:
      '{"server":{"port":3000,"host":"localhost"},"features":["auth"],"retries":3,"log":{"level":"info","pretty":true}}',
  },
  {
    type: "flag",
    flag: "--overrides, -o [JSON]",
    description: "The overrides to merge on top, in JSON format.",
    defaultValue: () =>
      pick([
        // Change one nested value; the sibling "host" must survive.
        '{"server":{"port":8080}}',
        // Arrays are replaced, not concatenated.
        '{"features":["auth","billing"]}',
        // Add a key inside an existing nested object.
        '{"log":{"file":"/var/log/app.log"},"retries":5}',
        // null wins over an object.
        '{"log":null}',
        // Nothing to merge.
        "{}",
        // A new nested object that defaults did not have.
        '{"db":{"url":"postgres://localhost/app","pool":{"max":10}}}',
      ]),
  },
] as const;
