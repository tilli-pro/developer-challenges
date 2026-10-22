import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

/**
 * An error that maps directly onto an HTTP response. Throw it from a route or
 * service and `errorHandler` turns it into `{ error: { code, message } }`.
 */
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const notFound = (what: string): HttpError =>
  new HttpError(404, `${what} not found`, "not_found");

export const conflict = (message: string): HttpError =>
  new HttpError(409, message, "conflict");

type ErrorBody = { error: { code: string; message: string } };

const body = (code: string, message: string): ErrorBody => ({
  error: { code, message },
});

export function errorHandler(
  error: FastifyError | HttpError,
  request: FastifyRequest,
  reply: FastifyReply,
): FastifyReply {
  if (error instanceof HttpError) {
    return reply
      .status(error.statusCode)
      .send(body(error.code ?? "error", error.message));
  }

  if ("validation" in error && error.validation) {
    return reply.status(400).send(body("validation_failed", error.message));
  }

  // Errors raised by Fastify itself (malformed JSON, unsupported media type,
  // payload too large) carry a 4xx status code and a safe message.
  const statusCode = error.statusCode ?? 500;
  if (statusCode < 500) {
    return reply.status(statusCode).send(body("bad_request", error.message));
  }

  request.log.error({ err: error }, "unhandled error");
  return reply.status(500).send(body("internal", "Internal Server Error"));
}

export function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): FastifyReply {
  const route = `${request.method} ${request.url}`;
  return reply.status(404).send(body("not_found", `route ${route} not found`));
}
