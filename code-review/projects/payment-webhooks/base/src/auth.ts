import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyRequest } from "fastify";
import { unauthorized } from "./lib/errors";

/** The admin key comes from the environment; the default is for local use. */
export function loadAdminKey(env: NodeJS.ProcessEnv = process.env): string {
  return env.ADMIN_KEY ?? "admin-dev-key";
}

// Hashing first gives both sides the same length, which timingSafeEqual needs.
const digest = (value: string): Buffer =>
  createHash("sha256").update(value).digest();

/** `onRequest` hook: every request needs the admin key in `x-admin-key`. */
export function adminKeyAuth(key: string = loadAdminKey()) {
  const expected = digest(key);
  return async function authenticate(request: FastifyRequest): Promise<void> {
    const header = request.headers["x-admin-key"];
    if (
      typeof header !== "string" ||
      !timingSafeEqual(digest(header), expected)
    ) {
      throw unauthorized();
    }
  };
}
