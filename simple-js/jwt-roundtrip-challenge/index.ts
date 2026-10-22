import type { Arg, Tags } from "../types";
import { pick } from "../utils";

export const main = async (
  subject: string,
  args: { secret: string; expiresIn: number; notBefore: number },
) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(
      subject,
      args.secret,
      Number(args.expiresIn),
      Number(args.notBefore),
    );
  }
};

export const description =
  "Sign and verify an HS256 JWT by hand with node:crypto, then prove it against the jose library.\n";
export const tags: Tags = {
  difficulty: "medium",
  topics: ["crypto", "auth", "encoding", "jwt"],
  minutes: 25,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[subject]",
    description: "The `sub` claim: who the token is for.",
    defaultValue: () => pick(["user:42", "ada@example.com", "svc:billing"]),
  },
  {
    type: "flag",
    flag: "--secret, -s [TEXT]",
    description: "The shared HMAC secret.",
    defaultValue: "dev-secret",
  },
  {
    type: "flag",
    flag: "--expires-in, -e [SECONDS]",
    description:
      "Seconds until the token expires. Zero or negative yields an already-expired token.",
    defaultValue: 3600,
  },
  {
    type: "flag",
    flag: "--not-before, -n [SECONDS]",
    description: "Seconds from now before the token becomes valid.",
    defaultValue: 0,
  },
] as const;
