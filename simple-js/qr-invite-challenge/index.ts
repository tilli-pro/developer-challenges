import type { Arg, Tags } from "../types";
import { pick } from "../utils";

export const main = async (
  email: string,
  args: { secret: string; base: string; ttl: number },
) => {
  const challengeModule = await import("./challenge");
  if (challengeModule?.main) {
    await challengeModule.main(email, args.secret, args.base, Number(args.ttl));
  }
};

export const description =
  "Create a signed invite link, render it as a terminal QR code, and verify the signature on the way back in.\n";
export const tags: Tags = {
  difficulty: "easy",
  topics: ["crypto", "encoding", "urls", "qr"],
  minutes: 15,
};
export const args: Arg[] = [
  {
    type: "arg",
    arg: "[email]",
    description: "The email address the invite is for.",
    defaultValue: () =>
      pick(["ada@example.com", "ben@example.com", "cara@example.com"]),
  },
  {
    type: "flag",
    flag: "--secret, -s [TEXT]",
    description: "The HMAC secret used to sign and verify invites.",
    defaultValue: "dev-secret",
  },
  {
    type: "flag",
    flag: "--base, -b [URL]",
    description: "The invite page URL the token is appended to.",
    defaultValue: "https://app.example.com/invite",
  },
  {
    type: "flag",
    flag: "--ttl, -t [SECONDS]",
    description: "How long the invite stays valid, in seconds.",
    defaultValue: 3600,
  },
] as const;
