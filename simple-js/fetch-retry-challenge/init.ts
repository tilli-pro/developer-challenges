import { MockAgent, fetch as undiciFetch } from "undici";

export type MockFetch = {
  /** A fetch function wired to the mock origin. Pass it as `fetchImpl`. */
  fetch: typeof fetch;
  /** How many requests the mock has received so far. */
  calls: () => number;
};

/**
 * Builds a fetch that never touches the network. The first `failures`
 * requests to any path on the origin get a 503 with a Retry-After header;
 * every request after that gets a 200 with a small JSON body.
 *
 * Node's built-in `fetch` bundles its own copy of undici, so
 * `setGlobalDispatcher` from the undici package does not affect it. The only
 * reliable way to route through a MockAgent is to use undici's own `fetch`
 * with the agent passed as `dispatcher`, which is what this returns.
 */
export const createMockFetch = (options: {
  failures: number;
  retryAfterSeconds: number;
}): MockFetch => {
  const agent = new MockAgent();
  agent.disableNetConnect();
  let calls = 0;

  const mockFetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const pool = agent.get(url.origin);
    calls++;
    if (calls <= options.failures) {
      pool
        .intercept({ path: url.pathname + url.search, method: "GET" })
        .reply(503, "Service Unavailable", {
          headers: {
            "retry-after": String(options.retryAfterSeconds),
            "content-type": "text/plain",
          },
        });
    } else {
      pool
        .intercept({ path: url.pathname + url.search, method: "GET" })
        .reply(200, JSON.stringify({ id: 42, status: "shipped" }), {
          headers: { "content-type": "application/json" },
        });
    }
    return undiciFetch(url, {
      ...(init as Parameters<typeof undiciFetch>[1]),
      dispatcher: agent,
    });
  }) as unknown as typeof fetch;

  return { fetch: mockFetch, calls: () => calls };
};
