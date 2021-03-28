import faker from 'faker';
import moment from 'moment';
import { logger } from 'server/utils/logger';
import { db } from 'server/db/mongodb';
import { config } from 'server/config';
import { kompassiGameMapper } from 'server/utils/kompassiGameMapper';
import { KompassiGame } from 'server/typings/game.typings';
import { Game } from 'shared/typings/models/game';

export const createGames = async (
  gameCount: number,
  signupTimes: number
): Promise<Game[]> => {
  const startingTimes = [] as string[];

  for (let i = 0; i < signupTimes; i += 1) {
    startingTimes.push(
      moment(config.CONVENTION_START_TIME)
        .add(i + 2, 'hours')
        .format()
    );
  }

  logger.info(
    `Generate data for ${gameCount} games for ${signupTimes} starting times`
  );

  const kompassiGames = [] as KompassiGame[];

  startingTimes.forEach((startingTime) => {
    for (let i = 0; i < gameCount; i += 1) {
      // @ts-expect-error @types/faker not updated yet
      const minAttendance = faker.datatype.number({ min: 3, max: 4 });
      // @ts-expect-error @types/faker not updated yet
      const maxAttendance = faker.datatype.number({ min: 4, max: 6 });
      const startTime = startingTime;
      const length = 180;

      const gameData = {
        title: faker.random.words(3),
        description: faker.lorem.sentences(5),
        category_title: 'Roolipeli',
        formatted_hosts: faker.internet.userName(),
        room_name: 'Ropetaverna',
        length,
        start_time: moment(startTime).format(),
        end_time: moment(startTime).add(length, 'minutes').format(),
        language: 'fi',
        rpg_system: 'Test gamesystem',
        no_language: true,
        english_ok: true,
        children_friendly: true,
        age_restricted: true,
        beginner_friendly: true,
        intended_for_experienced_participants: true,
        min_players: minAttendance,
        max_players: maxAttendance,
        // @ts-expect-error @types/faker not updated yet
        identifier: faker.datatype.number().toString(),
        tags: [
          'in-english',
          'sopii-lapsille',
          'vain-taysi-ikaisille',
          'aloittelijaystavallinen',
          'kunniavieras',
          'perheohjelma',
        ],
        genres: ['fantasy', 'war', 'exploration', 'mystery', 'drama'],
        styles: ['serious', 'story_driven', 'character_driven'],
        short_blurb: faker.lorem.sentence(),
        revolving_door: true,
        three_word_description: 'This is example ',
        is_beginner_friendly: true,
      };

      logger.info(`Stored game "${gameData.title}"`);
      kompassiGames.push(gameData);
    }
  });

  return await db.game.saveGames(kompassiGameMapper(kompassiGames));
};
