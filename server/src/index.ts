import "server/utils/instrument";
import { Server } from "node:http";
import { startServer, closeServer } from "server/utils/server";
import { logger } from "server/utils/logger";
import { startCronJobs } from "server/utils/cron";
import { config } from "shared/config";
import { initializeDayjs } from "shared/utils/initializeDayjs";
import { setupEmailNotificationQueue } from "./utils/notificationQueue";
import { MailgunSender } from "server/features/notifications/mailgunSender";

const startApp = async (): Promise<void> => {
  initializeDayjs();

  let server: Server;
  try {
    server = await startServer({
      dbConnString: config.server().dbConnString,
      port: config.server().port,
    });
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error("%s", new Error(`Starting server failed: ${error}`));
    return;
  }

  if (config.server().onlyCronjobs) {
    logger.info("Start enabled cronjobs");
    try {
      await startCronJobs();
    } catch (error) {
      logger.error("Error starting cronjobs: %s", error);
    }
  }
  if (!config.server().onlyCronjobs) {
    logger.info("Cronjobs not started, set ONLY_CRONJOBS to enable cronjobs");
  }

  try {
    const sender = new MailgunSender()
    setupEmailNotificationQueue(sender, config.server().emailNotificationQueueWorkerCount);
  } catch (error) {
    logger.error("%s", `Failed to initialize notification queue! ${error}`);
  }

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
    throw new TypeError(`Node environment NODE_ENV missing`);
  }

  startApp().catch((error: unknown) => {
    logger.error("%s", error);
  });
};

init();
