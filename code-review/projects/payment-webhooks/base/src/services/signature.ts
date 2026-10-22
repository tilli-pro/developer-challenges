import { createHmac, timingSafeEqual } from "node:crypto";

/** How far a signature's timestamp may drift from our clock, either way. */
export const TOLERANCE_SECONDS = 300;

const TIMESTAMP = /^\d{1,12}$/;
const SHA256_HEX = /^[0-9a-f]{64}$/i;

/** HMAC-SHA256 of `<t>.<rawBody>`, hex encoded. */
export function signAcme(timestamp: number, rawBody: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
}

/** Splits `t=<secs>,v1=<hex>` into its parts, or null when malformed. */
function parseHeader(header: string): { t: number; v1: string } | null {
  const parts = new Map<string, string>();
  for (const part of header.split(",")) {
    const index = part.indexOf("=");
    if (index <= 0) return null;
    parts.set(part.slice(0, index).trim(), part.slice(index + 1).trim());
  }

  const t = parts.get("t");
  const v1 = parts.get("v1");
  if (!t || !TIMESTAMP.test(t) || !v1 || !SHA256_HEX.test(v1)) return null;
  return { t: Number(t), v1 };
}

/**
 * Checks an `x-acme-signature` header against the exact request bytes.
 * Rejects malformed headers, timestamps more than TOLERANCE_SECONDS away from
 * `now`, and signatures that do not match, comparing in constant time.
 */
export function verifyAcmeSignature(
  header: string,
  rawBody: string,
  secret: string,
  now: () => Date,
): boolean {
  const parsed = parseHeader(header);
  if (!parsed) return false;

  const nowSeconds = Math.floor(now().getTime() / 1000);
  if (Math.abs(nowSeconds - parsed.t) > TOLERANCE_SECONDS) return false;

  const expected = Buffer.from(signAcme(parsed.t, rawBody, secret), "hex");
  const actual = Buffer.from(parsed.v1, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Everything the webhook route needs to authenticate one provider. */
export type WebhookProvider = {
  signatureHeader: string;
  secret: string;
  verify: typeof verifyAcmeSignature;
};

/**
 * The providers we accept webhooks from, keyed by the `:provider` path
 * segment. Secrets come from the environment; the defaults are for local use.
 */
export function loadProviders(
  env: NodeJS.ProcessEnv = process.env,
): Map<string, WebhookProvider> {
  const acme: WebhookProvider = {
    signatureHeader: "x-acme-signature",
    secret: env.ACME_WEBHOOK_SECRET ?? "acme-dev-secret",
    verify: verifyAcmeSignature,
  };
  return new Map([["acme", acme]]);
}
