import { Server } from "http";
import { startServer, closeServer } from "server/utils/server";
import { logger } from "server/utils/logger";
import { startCronJobs } from "server/utils/cron";
import { config } from "server/config";

const startApp = async (): Promise<void> => {
  if (config.onlyCronjobs) {
    logger.info("Start enabled cronjobs");
    try {
      startCronJobs();
    } catch (error) {
      logger.error("Error starting cronjobs: %s", error);
    }
  }
  if (!config.onlyCronjobs) {
    logger.info("Cronjobs not started, set ONLY_CRONJOBS to enable cronjobs");
  }

  let server: Server;
  try {
    server = await startServer({
      dbConnString: config.dbConnString,
      port: config.port,
    });
  } catch (error) {
    logger.error("%s", new Error(`Starting server failed: ${error}`));
    return;
  }

  process.once("SIGINT", (signal: string) => {
    closeServer(server, signal).catch((error) => {
      logger.error(error);
    });
  });
  process.once("SIGTERM", (signal: string) => {
    closeServer(server, signal).catch((error) => {
      logger.error(error);
    });
  });
};

const init = (): void => {
  if (typeof process.env.NODE_ENV === "string") {
    logger.info(`Node environment: ${process.env.NODE_ENV}`);
  } else {
    // eslint-disable-next-line no-restricted-syntax -- Server startup
    throw new Error(`Node environment NODE_ENV missing`);
  }

  startApp().catch((error) => {
    logger.error(error);
  });
};

init();
