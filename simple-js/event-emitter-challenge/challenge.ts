export type Listener = (...args: unknown[]) => void;

/**
 * The event emitter challenge.
 *
 * Implement the publish/subscribe pattern every UI framework and Node's
 * `node:events` provide. The rules:
 *   - `on` registers a listener and returns a function that removes it.
 *   - `once` is the same but the listener runs at most one time.
 *   - `off` removes one specific listener (the same function reference).
 *   - `emit` calls every listener for the event, in the order they were
 *     registered, passing along the extra arguments, and returns how many
 *     listeners ran.
 *   - Removing a listener while an emit is in progress must not cause any
 *     other listener in that same emit to be skipped.
 *
 * Example:
 *   const bus = new EventEmitter();
 *   const stop = bus.on("save", (doc) => console.log("saved", doc));
 *   bus.once("save", () => console.log("first save only"));
 *   bus.emit("save", "a");   // logs both, returns 2
 *   bus.emit("save", "b");   // logs "saved b" only, returns 1
 *   stop();
 *   bus.emit("save", "c");   // returns 0
 */
export class EventEmitter {
  on(event: string, listener: Listener): () => void {
    return () => {};
  }

  once(event: string, listener: Listener): () => void {
    return () => {};
  }

  off(event: string, listener: Listener): void {}

  emit(event: string, ...args: unknown[]): number {
    return 0;
  }
}

/**
 * Runs a small script against the emitter so you can see it behave. Each
 * step is "on:evt", "once:evt", "off:evt" or "emit:evt[:arg]". "off" removes
 * the most recently registered listener for that event.
 */
export const main = (steps: string[]) => {
  console.log("Script:", steps.join(", "));
  const bus = new EventEmitter();
  const registered = new Map<string, Listener[]>();
  let count = 0;

  const makeListener = (event: string) => {
    const id = ++count;
    const listener: Listener = (...args) =>
      console.log(`  [${event}] listener #${id} got`, args);
    registered.set(event, [...(registered.get(event) ?? []), listener]);
    return listener;
  };

  for (const step of steps) {
    const [op, event, ...rest] = step.split(":");
    if (!op || !event) {
      console.log(`Skipping malformed step "${step}"`);
      continue;
    }
    switch (op) {
      case "on":
        bus.on(event, makeListener(event));
        console.log(`on ${event} (listener #${count})`);
        break;
      case "once":
        bus.once(event, makeListener(event));
        console.log(`once ${event} (listener #${count})`);
        break;
      case "off": {
        const listener = registered.get(event)?.pop();
        if (listener) {
          bus.off(event, listener);
          console.log(`off ${event} (latest listener)`);
        } else {
          console.log(`off ${event} (nothing registered)`);
        }
        break;
      }
      case "emit": {
        const ran = bus.emit(event, ...rest);
        console.log(
          `emit ${event} ${JSON.stringify(rest)} -> ${ran} listener(s) ran`,
        );
        break;
      }
      default:
        console.log(`Skipping unknown op "${op}"`);
    }
  }
};
