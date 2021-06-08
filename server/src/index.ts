import 'array-flat-polyfill';
import { startServer } from 'server/utils/startServer';
import { closeServer } from 'server/utils/closeServer';
import { logger } from 'server/utils/logger';
import { autoUpdateGames, autoAssignPlayers } from 'server/utils/cron';
import { config } from 'server/config';

const startApp = async (): Promise<void> => {
  // Start cronjob to auto update games from Kompassi
  autoUpdateGames().catch((error) => {
    logger.error(error);
  });

  // Start cronjob to automatically assing players
  autoAssignPlayers().catch((error) => {
    logger.error(error);
  });

  const server = await startServer(config.dbConnString, config.port);

  process.on('SIGINT', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    closeServer(server, config.dbConnString);
  });
  process.on('SIGTERM', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    closeServer(server, config.dbConnString);
  });
};

const init = (): void => {
  if (typeof process.env.NODE_ENV === 'string') {
    logger.info(`Node environment: ${process.env.NODE_ENV}`);
  } else {
    throw new Error(`Node environment NODE_ENV missing`);
  }

  startApp().catch((error) => {
    logger.error(error);
  });
};

init();
