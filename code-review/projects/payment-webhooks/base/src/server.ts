import { buildApp } from "./app";
import { FakePublisher } from "./services/outbox";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";
const DRAIN_INTERVAL_MS = 1000;

// No message bus locally: the fake publisher logs each message it delivers.
const publisher = new FakePublisher(({ topic, payload }) => {
  app.log.info({ topic, payload }, "published");
});
const app = buildApp({ logger: true, publisher });

// Deliveries and per-message failures are logged by the publisher and outbox.
const timer = setInterval(() => {
  app.drainOutbox().catch((error: unknown) => {
    app.log.error({ err: error }, "outbox drain failed");
  });
}, DRAIN_INTERVAL_MS);
app.addHook("preClose", async () => clearInterval(timer));

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
