import { type Config, ConfigSchema, z } from "./init";

/**
 * The config validate challenge.
 *
 * Load the JSON file at `configPath`, then apply overrides from the env file
 * at `envPath`, then validate the result with `ConfigSchema` and return the
 * parsed config.
 *
 * Env file rules:
 *   - One `KEY=VALUE` per line. Blank lines and lines starting with `#` are
 *     ignored.
 *   - A double underscore in the key means a nested path, and keys are
 *     lowercased: `SERVER__PORT=8080` sets `config.server.port` to "8080".
 *   - Env values always win over the JSON values.
 *   - Env values are strings. The schema coerces them where it can.
 *
 * Validation rules:
 *   - Use `ConfigSchema.safeParse` (never `parse`, we want to format errors).
 *   - On failure, throw an Error whose message has one line per issue, in the
 *     form `path: message`, e.g. `server.port: Too big: expected number to be <=65535`.
 *     (`z.prettifyError` produces something close to this for free.)
 *
 * Example (with the bundled config.json and sample.env):
 *   loadConfig(configPath, envPath) -> {
 *     server: { port: 8080, host: "localhost" },
 *     database: { url: "postgres://localhost/app" },
 *     features: ["auth", "beta"],
 *     log: { level: "debug" },
 *   }
 *
 * @param configPath Path to the base JSON config.
 * @param envPath Path to the env file with overrides.
 */
const loadConfig = async (
  configPath: string,
  envPath: string,
): Promise<Config> => {
  throw new Error("Not implemented");
};

export const main = async (configPath: string, envPath: string) => {
  console.log("Config:", configPath);
  console.log("Env:   ", envPath);
  try {
    const config = await loadConfig(configPath, envPath);
    console.log("Loaded config:\n", config);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`Invalid config:\n${message}`);
  }
};

// Keep the schema helpers reachable for candidates who want to poke at them.
export { ConfigSchema, z };
