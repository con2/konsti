import "server/utils/instrument";
import { Server } from "node:http";
import { startServer, closeServer } from "server/utils/server";
import { logger } from "server/utils/logger";
import { startCronJobs } from "server/utils/cron";
import { config } from "shared/config";
import { initializeDayjs } from "shared/utils/initializeDayjs";
import { setupQueue } from "./utils/notificationQueue";

const startApp = async (): Promise<void> => {
  initializeDayjs();

  let server: Server;
  try {
    server = await startServer({
      dbConnString: config.server().dbConnString,
      port: config.server().port,
    });
  } catch (error) {
    logger.error("%s", new Error(`Starting server failed: ${String(error)}`));
    return;
  }

  const enableCronjobs =
    config.server().onlyCronjobs ||
    config.server().cronjobsAndBackendSameInstance;

  if (enableCronjobs) {
    logger.info("Start enabled cronjobs");
    try {
      await startCronJobs();
    } catch (error) {
      logger.error("Error starting cronjobs: %s", error);
    }
  }
  if (!enableCronjobs) {
    logger.info("Cronjobs not started, set ONLY_CRONJOBS to enable cronjobs");
  }

  setupQueue();

  process.once("SIGINT", (signal: string) => {
    closeServer(server, signal).catch((error: unknown) => {
      logger.error("%s", error);
    });
  });
  process.once("SIGTERM", (signal: string) => {
    closeServer(server, signal).catch((error: unknown) => {
      logger.error("%s", error);
    });
  });
};

const init = (): void => {
  if (typeof process.env.NODE_ENV === "string") {
    logger.info(`Node environment: ${process.env.NODE_ENV}`);
  } else {
    // eslint-disable-next-line no-restricted-syntax -- Server startup
    throw new TypeError("Node environment NODE_ENV missing");
  }

  startApp().catch((error: unknown) => {
    logger.error("%s", error);
  });
};

init();
