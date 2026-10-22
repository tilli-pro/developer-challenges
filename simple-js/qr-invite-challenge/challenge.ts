import { renderQr } from "./init";

/** What a verified invite token carries. */
export type Invite = { email: string; id: string };

/**
 * The QR invite challenge, part 1: create.
 *
 * Build a signed invite link and render it as a QR code:
 *   1. The payload is `{ email, id, exp }` where `id` is a fresh
 *      `crypto.randomUUID()` and `exp` is the Unix time in seconds at which
 *      the invite expires (now + ttlSeconds).
 *   2. Encode the JSON payload as base64url (no padding). Call it `body`.
 *   3. Sign `body` with HMAC-SHA256 using `secret` and encode the raw digest
 *      as base64url. Call it `sig`.
 *   4. The token is `${body}.${sig}` and the url is
 *      `${baseUrl}?token=${token}`.
 *   5. Render the url with `renderQr` from ./init.
 *
 * Example:
 *   createInvite("ada@example.com", "s3cret", "https://app.example.com/invite", 3600)
 *     -> { url: "https://app.example.com/invite?token=eyJlbWFpbCI6...‌.q3xJ...", qr: "█▀▀▀▀▀█ ..." }
 *
 * @param email Who the invite is for.
 * @param secret The HMAC secret.
 * @param baseUrl The page that will receive the token.
 * @param ttlSeconds How long the invite is valid.
 */
const createInvite = async (
  email: string,
  secret: string,
  baseUrl: string,
  ttlSeconds: number,
): Promise<{ url: string; qr: string }> => {
  return { url: "", qr: "" };
};

/**
 * The QR invite challenge, part 2: verify.
 *
 * Parse `url` with `new URL`, read its `token` query parameter, split it into
 * `body` and `sig`, recompute the HMAC of `body` with `secret`, and compare
 * it to `sig` using `crypto.timingSafeEqual`. Reject (return null) when the
 * token is missing or malformed, the signature does not match, or the
 * payload's `exp` is at or before `now`. Otherwise return the payload's
 * `email` and `id`.
 *
 * Example:
 *   verifyInvite(url, "s3cret", new Date())  -> { email: "ada@example.com", id: "4f1c..." }
 *   verifyInvite(url, "wrong", new Date())   -> null
 *
 * @param url The full invite url.
 * @param secret The HMAC secret.
 * @param now The current time, used to check expiry.
 */
const verifyInvite = (
  url: string,
  secret: string,
  now: Date,
): Invite | null => {
  return null;
};

export const main = async (
  email: string,
  secret: string,
  baseUrl: string,
  ttlSeconds: number,
) => {
  console.log("Email:", email);
  console.log("Base URL:", baseUrl);
  console.log("TTL:", ttlSeconds, "seconds");
  const { url, qr } = await createInvite(email, secret, baseUrl, ttlSeconds);
  if (qr) {
    console.log(`\n${qr}`);
  }
  console.log("URL:", url || "(none)");
  const now = new Date();
  console.log(
    "\nVerify with the right secret:",
    verifyInvite(url, secret, now),
  );
  console.log(
    "Verify with a wrong secret:   ",
    verifyInvite(url, `${secret}-wrong`, now),
  );
};
