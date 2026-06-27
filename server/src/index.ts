import "server/utils/instrument";
import { Server } from "node:http";
import { startServer, closeServer } from "server/utils/server";
import { logger } from "server/utils/logger";
import { startCronJobs } from "server/utils/cron";
import { config } from "shared/config";
import { initializeDayjs } from "shared/utils/initializeDayjs";
import {
  createNotificationQueueService,
  setGlobalNotificationQueueService,
} from "./utils/notificationQueue";
import { EmailSender } from "server/features/notifications/email";

const startApp = async (): Promise<void> => {
  initializeDayjs();

  let server: Server;
  try {
    server = await startServer({
      dbConnString: config.server().dbConnString,
      port: config.server().port,
    });
  } catch (error) {
    logger.error(new Error("Starting server failed", { cause: error }));
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
      logger.error(new Error("Error starting cronjobs", { cause: error }));
    }
  }
  if (!enableCronjobs) {
    logger.info("Cronjobs not started, set ONLY_CRONJOBS to enable cronjobs");
  }

  // Initialize notification queue
  try {
    const notificationQueueService = createNotificationQueueService(
      new EmailSender(),
      config.server().emailNotificationQueueWorkerCount,
    );
    setGlobalNotificationQueueService(notificationQueueService);
    logger.info("Email notification queue initialized.");
  } catch (error) {
    logger.error(
      new Error("Failed to initialize notification queue!", { cause: error }),
    );
  }

  process.once("SIGINT", (signal: string) => {
    void handleShutdown(server, signal);
  });
  process.once("SIGTERM", (signal: string) => {
    void handleShutdown(server, signal);
  });
};

const handleShutdown = async (
  server: Server,
  signal: string,
): Promise<void> => {
  try {
    await closeServer(server, signal);
  } catch (error: unknown) {
    logger.error(error);
  }
};

const init = async (): Promise<void> => {
  if (typeof process.env.NODE_ENV === "string") {
    logger.info(`Node environment: ${process.env.NODE_ENV}`);
  } else {
    // eslint-disable-next-line no-restricted-syntax -- Server startup
    throw new TypeError("Node environment NODE_ENV missing");
  }

  try {
    await startApp();
  } catch (error: unknown) {
    logger.error(error);
  }
};

await init();
