import { setTimeout as sleep } from "node:timers/promises";
import { createMockFetch } from "./init";

export type RetryOptions = {
  /** Extra attempts allowed after the first one. */
  retries: number;
  /** Per-attempt timeout in milliseconds. */
  timeoutMs: number;
  /** The fetch to use. Defaults to the global one. */
  fetchImpl?: typeof fetch;
  /** How to wait between attempts. Defaults to a real timer; tests inject a no-op. */
  sleep?: (ms: number) => Promise<void>;
  /** Called before each retry with the attempt number (1-based) and the wait. */
  onRetry?: (attempt: number, waitMs: number, reason: string) => void;
};

/**
 * The fetch retry challenge.
 *
 * Fetch `url` and return the response, retrying when the server says it is
 * temporarily unable to help:
 *   - Retry only on status 503 and 429, and on a per-attempt timeout.
 *     Any other status, including other 4xx and 5xx, is returned as-is.
 *   - Allow at most `retries` extra attempts after the first.
 *   - Before a retry, wait for the `Retry-After` header's value in seconds
 *     when the response carries one (integer seconds; the HTTP-date form may
 *     be ignored). Otherwise back off exponentially: 200ms, 400ms, 800ms...
 *   - Give each attempt its own `AbortSignal.timeout(timeoutMs)`. A timeout
 *     is a retryable failure like a 503.
 *   - When attempts run out, throw an Error that says how many were made.
 *
 * Use `options.fetchImpl` (falling back to the global `fetch`) for the
 * request and `options.sleep` (falling back to a timer) for the wait, so the
 * runner can inject a mock origin and tests can skip real waiting. Call
 * `options.onRetry` before each wait if it is given.
 *
 * Example (mock returns 503 twice then 200, retries 3):
 *   attempt 1 -> 503, wait Retry-After
 *   attempt 2 -> 503, wait Retry-After
 *   attempt 3 -> 200, return it
 *
 * @param url The URL to fetch.
 * @param options Retry, timeout and injection settings.
 */
const fetchWithRetry = async (
  url: string,
  options: RetryOptions,
): Promise<Response> => {
  return (options.fetchImpl ?? fetch)(url);
};

export const main = async (
  url: string,
  settings: {
    failures: number;
    retries: number;
    timeoutMs: number;
    retryAfterSeconds: number;
  },
) => {
  const { failures, retries, timeoutMs, retryAfterSeconds } = settings;
  console.log("URL:", url);
  console.log(
    `Mock: ${failures} x 503 (Retry-After: ${retryAfterSeconds}s), then 200`,
  );
  console.log(`Retries: ${retries}, timeout per attempt: ${timeoutMs}ms\n`);

  const mock = createMockFetch({ failures, retryAfterSeconds });
  const startedAt = Date.now();
  const elapsed = () => `+${Date.now() - startedAt}ms`;

  try {
    const response = await fetchWithRetry(url, {
      retries,
      timeoutMs,
      fetchImpl: async (input, init) => {
        const response = await mock.fetch(input, init);
        console.log(
          `  ${elapsed()} attempt ${mock.calls()} -> ${response.status}`,
        );
        return response;
      },
      sleep,
      onRetry: (attempt, waitMs, reason) =>
        console.log(
          `  ${elapsed()} retry ${attempt} in ${waitMs}ms (${reason})`,
        ),
    });
    console.log(`\nFinal status: ${response.status}`);
    console.log("Body:", await response.text());
  } catch (error) {
    console.log(`\nFailed: ${(error as Error).message}`);
  }
  console.log("Elapsed:", elapsed());
  console.log("Requests the mock received:", mock.calls());
};
