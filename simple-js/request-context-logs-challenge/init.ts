import { Writable } from "node:stream";
import pino, { type Logger } from "pino";

export type { Logger };

/**
 * A pino logger that writes JSON lines into memory instead of stdout, so the
 * runner can inspect every line after the simulated requests finish.
 */
export const createBaseLogger = (): {
  logger: Logger;
  lines: () => Record<string, unknown>[];
} => {
  const collected: Record<string, unknown>[] = [];
  const sink = new Writable({
    write(chunk, _encoding, callback) {
      for (const line of chunk.toString().split("\n")) {
        if (line.trim() !== "") {
          collected.push(JSON.parse(line));
        }
      }
      callback();
    },
  });
  const logger = pino({ base: null, timestamp: false, level: "info" }, sink);
  return { logger, lines: () => [...collected] };
};
