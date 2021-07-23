import fs from 'fs';
import path from 'path';
import request from 'request-promise-native';
import { logger } from 'server/utils/logger';
import { config } from 'server/config';
import { KompassiGame } from 'server/typings/game.typings';
import { KompassiProgramType } from 'shared/constants/kompassiProgramType';

export const updateGames = async (): Promise<readonly KompassiGame[]> => {
  let programItems: readonly KompassiGame[] = [];

  if (config.useLocalProgramFile) {
    logger.info('Games: GET games from local filesystem');

    const rawData = fs.readFileSync(
      path.join(
        __dirname,
        '../test/kompassi-data-dumps/program-ropecon-2019.json'
      ),
      'utf8'
    );

    programItems = JSON.parse(rawData);

    logger.info(`Loaded ${programItems.length} program items`);
  } else {
    logger.info('Games: GET games from remote server');

    const options = {
      uri: config.dataUri,
      headers: {
        'User-Agent': 'Request-Promise',
      },
      json: true,
    };

    try {
      programItems = await request(options);
    } catch (error) {
      logger.error(`Games request error: ${error}`);
      return await Promise.reject(error);
    }
  }

  if (!programItems || programItems.length === 0) {
    logger.info('No program items found');
    return [];
  }

  const filteredProgramItems = programItems.filter((programItem) => {
    if (
      programItem.category_title === KompassiProgramType.TABLETOP_RPG ||
      programItem.category_title === KompassiProgramType.LARP
    ) {
      return programItem;
    }
  });

  if (filteredProgramItems.length === 0) {
    logger.info('No program items with required categories found');
  }

  return filteredProgramItems;
};
