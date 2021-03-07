import 'array-flat-polyfill';
import { startServer } from 'server/utils/startServer';
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
  const server = await startServer(config.dbConnString);

  const app = server.listen(server.get('port'), () => {
    const address = app?.address();
    if (!address || typeof address === 'string') return;
    logger.info(`Express: Server started on port ${address.port}`);
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
