import type { FastifyReply, FastifyRequest } from "fastify";

export type Role = "admin" | "readonly";

const READ_METHODS = new Set(["GET", "HEAD"]);

/** API keys come from the environment; the defaults are for local use only. */
export function loadApiKeys(env: NodeJS.ProcessEnv = process.env) {
  return new Map<string, Role>([
    [env.API_KEY_ADMIN ?? "admin-dev-key", "admin"],
    [env.API_KEY_READONLY ?? "readonly-dev-key", "readonly"],
  ]);
}

/**
 * `onRequest` hook: every request needs a known `x-api-key`, and readonly keys
 * may only read.
 */
export function apiKeyAuth(keys: Map<string, Role> = loadApiKeys()) {
  return async function authenticate(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply | undefined> {
    const header = request.headers["x-api-key"];
    const role = typeof header === "string" ? keys.get(header) : undefined;

    if (!role) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    if (role === "readonly" && !READ_METHODS.has(request.method)) {
      return reply.code(403).send({ error: "forbidden" });
    }
  };
}
