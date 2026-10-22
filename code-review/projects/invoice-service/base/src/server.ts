import { buildApp } from "./app";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";

const app = buildApp({ logger: true });

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    app.log.info({ signal }, "shutting down");
    app.close().then(
      () => process.exit(0),
      (error: unknown) => {
        app.log.error({ err: error }, "error during shutdown");
        process.exit(1);
      },
    );
  });
}

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error({ err: error }, "failed to start");
  process.exit(1);
}
