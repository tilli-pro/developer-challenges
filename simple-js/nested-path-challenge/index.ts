import type { Arg } from "../types";
import { pick } from "../utils";

export const main = async (path: string, args: { object: string }) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(JSON.parse(args.object), path);
  }
};

export const description =
  "Read a value out of a nested object using a dot-separated path.\n";
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[path]",
    description: 'The dot-separated path to read, e.g. "user.address.city".',
    defaultValue: () =>
      pick([
        "user.address.city",
        "user.name",
        "user.address.postcode",
        "user.phone.number",
        "active",
      ]),
  },
  {
    type: "flag",
    flag: "--object, -o [JSON]",
    description: "The object to read from, in JSON format.",
    defaultValue:
      '{"user":{"name":"Ada","address":{"city":"London","postcode":"NW1"}},"active":true}',
  },
] as const;
