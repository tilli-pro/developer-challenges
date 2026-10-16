import { setTimeout as sleep } from "node:timers/promises";

/** A unit of async work that has not started yet. */
export type Task<T> = () => Promise<T>;

/**
 * The promise pool challenge.
 *
 * Run every task, but never have more than `limit` of them in flight at the
 * same time. As soon as one task settles, the next unstarted task should
 * begin. Resolve with the results in the same order as the input tasks,
 * regardless of which finished first. If any task rejects, reject with that
 * error.
 *
 * This is what you need when, say, you have 500 URLs to fetch and the API
 * allows 5 concurrent requests. `Promise.all` would fire all 500 at once.
 *
 * Example (limit 2, tasks taking 300ms, 100ms, 200ms):
 *   t=0    A and B start
 *   t=100  B finishes, C starts
 *   t=300  A and C finish
 *   result -> [resultA, resultB, resultC], total time ~300ms not 600ms
 *
 * @param tasks Functions that start a task when called and return its promise.
 * @param limit The maximum number of tasks running at once. At least 1.
 */
const promisePool = async <T>(
  tasks: Task<T>[],
  limit: number,
): Promise<T[]> => {
  return [];
};

export const main = async (durations: number[], limit: number) => {
  console.log("Task durations (ms):", durations);
  console.log("Concurrency limit:", limit);

  // Each task waits for its duration and resolves with its own index. We also
  // track how many are running at once so you can check the limit is honoured.
  const startedAt = Date.now();
  let running = 0;
  let peak = 0;
  const tasks: Task<number>[] = durations.map((ms, index) => async () => {
    running++;
    peak = Math.max(peak, running);
    console.log(`  +${Date.now() - startedAt}ms start task ${index} (${ms}ms)`);
    await sleep(ms);
    running--;
    console.log(`  +${Date.now() - startedAt}ms done  task ${index}`);
    return index;
  });

  const results = await promisePool(tasks, limit);
  console.log("Results:", results);
  console.log(
    "Peak concurrency:",
    peak,
    peak <= limit ? "(ok)" : "(over limit!)",
  );
  console.log("Total time:", `${Date.now() - startedAt}ms`);
};
