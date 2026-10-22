import { jwtVerify } from "jose";

export type JoseResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; reason: string };

/**
 * Verifies a token with the jose library. This is the oracle: a hand-written
 * HS256 implementation is correct when jose accepts what it signs and it
 * accepts what jose signs.
 */
export const verifyWithJose = async (
  token: string,
  secret: string,
): Promise<JoseResult> => {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] },
    );
    return { ok: true, payload: payload as Record<string, unknown> };
  } catch (error) {
    return { ok: false, reason: (error as Error).message };
  }
};
