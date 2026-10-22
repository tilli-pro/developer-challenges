import { randomUUID } from "node:crypto";
import { verifyWithJose } from "./init";

/**
 * The JWT round trip challenge, part 1: signing.
 *
 * Produce an HS256 JSON Web Token by hand. The header is always
 * `{ "alg": "HS256", "typ": "JWT" }`. The token is three base64url-encoded
 * parts joined by dots, with no `=` padding:
 *
 *   base64url(header) + "." + base64url(payload) + "." + base64url(signature)
 *
 * where `signature` is HMAC-SHA256 over the string `header + "." + payload`
 * (the two already-encoded parts) keyed with `secret`.
 *
 * Example:
 *   signHs256({ sub: "user:42", exp: 1900000000 }, "dev-secret")
 *   -> "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyOjQyIiwiZXhwIjoxOTAwMDAwMDAwfQ.<43 chars>"
 *
 * @param payload The claims to sign.
 * @param secret The shared HMAC secret.
 */
const signHs256 = (
  payload: Record<string, unknown>,
  secret: string,
): string => {
  return "";
};

/**
 * The JWT round trip challenge, part 2: verifying.
 *
 * Split the token into its three parts and:
 *   - decode the header and reject anything whose `alg` is not exactly
 *     "HS256" (in particular "none"),
 *   - recompute the signature with `secret` and compare it to the third part
 *     with `crypto.timingSafeEqual`,
 *   - decode the payload and enforce `exp` (reject if now >= exp) and `nbf`
 *     (reject if now < nbf); both are unix timestamps in seconds and both are
 *     optional.
 *
 * Return the payload when everything checks out, otherwise `null`. Never
 * throw on malformed input.
 *
 * @param token The compact JWT string.
 * @param secret The shared HMAC secret.
 * @param now The current time, injected so expiry can be tested.
 */
const verifyHs256 = (
  token: string,
  secret: string,
  now: Date,
): Record<string, unknown> | null => {
  return null;
};

const decodePart = (part: string | undefined) => {
  if (!part) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch {
    return null;
  }
};

export const main = async (
  subject: string,
  secret: string,
  expiresIn: number,
  notBefore: number,
) => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const claims = {
    sub: subject,
    iat: nowSeconds,
    exp: nowSeconds + expiresIn,
    nbf: nowSeconds + notBefore,
    jti: randomUUID(),
  };
  console.log("Claims:", claims);

  const token = signHs256(claims, secret);
  console.log("\nToken:", token === "" ? "(empty)" : token);
  const [header, payload] = token.split(".");
  console.log("Decoded header:", decodePart(header));
  console.log("Decoded payload:", decodePart(payload));

  console.log("\nHand-written verify:", verifyHs256(token, secret, new Date()));

  const jose = await verifyWithJose(token, secret);
  console.log(
    "jose verify:",
    jose.ok ? jose.payload : `rejected (${jose.reason})`,
  );

  const wrong = await verifyWithJose(token, `${secret}-wrong`);
  console.log(
    "jose verify with wrong secret:",
    wrong.ok ? "ACCEPTED (bug!)" : `rejected (${wrong.reason})`,
  );
};
