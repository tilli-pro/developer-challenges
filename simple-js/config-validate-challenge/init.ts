import { z } from "zod";

/** Accepts either a real array or the comma-separated form used in env files. */
const commaList = z.preprocess(
  (value) => (typeof value === "string" ? value.split(",") : value),
  z.array(z.enum(["auth", "beta", "billing"])),
);

/** The shape a valid application config must have after env overrides. */
export const ConfigSchema = z.object({
  server: z.object({
    port: z.coerce.number().int().min(1).max(65535),
    host: z.string().default("localhost"),
  }),
  database: z.object({
    url: z.url(),
  }),
  features: commaList,
  log: z.object({
    level: z.enum(["debug", "info", "warn", "error"]),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

/** Re-exported so the challenge can format validation issues. */
export { z };
