import { AsyncLocalStorage } from "node:async_hooks";
import { randomInt } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { createBaseLogger, type Logger } from "./init";

const base = createBaseLogger();

/** The per-request context. Populate it with `store.run` and read it with `store.getStore()`. */
const store = new AsyncLocalStorage<{ requestId: string }>();

/**
 * The request context logs challenge, part 1.
 *
 * Run `fn` inside a fresh request context carrying a `requestId` generated
 * with `crypto.randomUUID()`. Everything `fn` does, however deeply nested and
 * across however many `await`s, should be able to see that id through
 * `store.getStore()` without it being passed as a parameter.
 *
 * @param fn The request handler to run.
 */
const withRequestContext = <T>(fn: () => Promise<T>): Promise<T> => {
  return fn();
};

/**
 * The request context logs challenge, part 2.
 *
 * Return a logger for the current request: a child of the base logger that
 * stamps `requestId` on every line. Outside any request context, return the
 * base logger itself.
 *
 * Example line once solved:
 *   {"level":30,"requestId":"5f0c...","msg":"fetched user"}
 */
const getLogger = (): Logger => {
  return base.logger;
};

// --- a simulated service, three calls deep, that never sees a request id ---

const loadProfile = async (maxDelay: number) => {
  await sleep(randomInt(0, maxDelay + 1));
  getLogger().info("fetched user");
};

const userService = async (maxDelay: number) => {
  await loadProfile(maxDelay);
};

const handleRequest = async (n: number, maxDelay: number) => {
  getLogger().info(`start request ${n}`);
  await sleep(randomInt(0, maxDelay + 1));
  await userService(maxDelay);
  await sleep(randomInt(0, maxDelay + 1));
  getLogger().info(`done request ${n}`);
};

export const main = async (requests: number, maxDelay: number) => {
  console.log(
    `Running ${requests} concurrent request(s), up to ${maxDelay}ms per step\n`,
  );

  await Promise.all(
    Array.from({ length: requests }, (_, i) =>
      withRequestContext(() => handleRequest(i + 1, maxDelay)),
    ),
  );
  await sleep(10); // let pino flush the last line into the sink

  const lines = base.lines();
  for (const line of lines) {
    console.log(JSON.stringify(line));
  }

  const ids = new Set<string>();
  let missing = 0;
  const byId = new Map<string, string[]>();
  for (const line of lines) {
    const id = line.requestId;
    if (typeof id !== "string") {
      missing++;
      continue;
    }
    ids.add(id);
    byId.set(id, [...(byId.get(id) ?? []), String(line.msg)]);
  }
  const consistent = [...byId.values()].every(
    (msgs) =>
      msgs.length === 3 &&
      msgs[0]?.startsWith("start") &&
      msgs[1] === "fetched user" &&
      msgs[2]?.startsWith("done"),
  );

  console.log(
    `\n${ids.size} distinct request id(s), ${missing} line(s) without requestId,`,
    `each request's lines share one id: ${ids.size === requests && consistent ? "yes" : "no"}`,
  );
  console.log(
    ids.size === requests && missing === 0 && consistent
      ? "Context OK"
      : "Context NOT propagated",
  );
};
