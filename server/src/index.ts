import { startServer, closeServer } from "server/utils/server";
import { logger } from "server/utils/logger";
import { startCronJobs } from "server/utils/cron";
import { config } from "server/config";

const startApp = async (): Promise<void> => {
  try {
    await startCronJobs();
  } catch (error) {
    logger.error(`Cronjob failed: ${error}`);
  }

  const server = await startServer(config.dbConnString, config.port);

  process.on("SIGINT", () => {
    closeServer(server).catch((error) => {
      logger.error(error);
    });
  });
  process.on("SIGTERM", () => {
    closeServer(server).catch((error) => {
      logger.error(error);
    });
  });
};

const init = (): void => {
  if (typeof process.env.NODE_ENV === "string") {
    logger.info(`Node environment: ${process.env.NODE_ENV}`);
  } else {
    throw new Error(`Node environment NODE_ENV missing`);
  }

  startApp().catch((error) => {
    logger.error(error);
  });
};

init();
