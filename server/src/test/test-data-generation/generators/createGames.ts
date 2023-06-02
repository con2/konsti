import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { sampleSize } from "lodash";
import { logger } from "server/utils/logger";
import { kompassiGameMapper } from "server/utils/kompassiGameMapper";
import { Game } from "shared/typings/models/game";
import { saveGames } from "server/features/game/gameRepository";
import { sharedConfig } from "shared/config/sharedConfig";
import {
  KompassiGame,
  KompassiGameStyle,
  KompassiGenre,
  KompassiProgramType,
  KompassiTag,
  tournamentProgramTypes,
  workshopProgramTypes,
} from "shared/typings/models/kompassiGame";
import { TOURNAMENT_EVENT_TYPE } from "server/features/game/utils/getGamesFromKompassi";
import { Result } from "shared/utils/result";
import { MongoDbError } from "shared/typings/api/errors";

const GAME_ID_MAX = 10000000;

const startingTimes = [
  dayjs(sharedConfig.CONVENTION_START_TIME).format(),
  dayjs(sharedConfig.CONVENTION_START_TIME).add(2, "hours").format(),
  dayjs(sharedConfig.CONVENTION_START_TIME).add(3, "hours").format(),
  dayjs(sharedConfig.CONVENTION_START_TIME).add(1, "days").format(),
  dayjs(sharedConfig.CONVENTION_START_TIME).add(2, "days").format(),
];

const getMinPlayers = (programType: KompassiProgramType): number => {
  if (tournamentProgramTypes.includes(programType)) {
    return faker.number.int({ min: 6, max: 10 });
  }

  if (workshopProgramTypes.includes(programType)) {
    return 0;
  }

  return faker.number.int({ min: 2, max: 3 });
};

const getMaxPlayers = (programType: KompassiProgramType): number => {
  if (tournamentProgramTypes.includes(programType)) {
    return faker.number.int({ min: 12, max: 20 });
  }

  if (workshopProgramTypes.includes(programType)) {
    return faker.number.int({ min: 12, max: 20 });
  }

  return faker.number.int({ min: 3, max: 4 });
};

export const createGames = async (
  gameCount: number
): Promise<Result<Game[], MongoDbError>> => {
  const kompassiGames: KompassiGame[] = [];

  const programTypes = [
    KompassiProgramType.TABLETOP_RPG,
    KompassiProgramType.LARP,
    KompassiProgramType.BOARD_GAME,
    KompassiProgramType.WORKSHOP_MINIATURE,
  ];

  programTypes.map((programType) => {
    logger.info(
      `Generate data for ${gameCount} programs of type "${programType}" for ${startingTimes.length} starting times`
    );

    startingTimes.forEach((startingTime) => {
      for (let i = 0; i < gameCount; i += 1) {
        const startTime = startingTime;
        const length = 180;

        const kompassiGameData: KompassiGame = {
          title: faker.word.words(3),
          description: faker.lorem.sentences(5),
          category_title: programType,
          formatted_hosts: faker.internet.userName(),
          room_name: "Ropetaverna",
          length,
          start_time: dayjs(startTime).format(),
          end_time: dayjs(startTime).add(length, "minutes").format(),
          language: "fi",
          rpg_system:
            programType === KompassiProgramType.TABLETOP_RPG
              ? "Test gamesystem"
              : "",
          min_players: getMinPlayers(programType),
          max_players: getMaxPlayers(programType),
          identifier: faker.number.int(GAME_ID_MAX).toString(),
          tags: sampleSize(Object.values(KompassiTag), 3),
          genres: sampleSize(Object.values(KompassiGenre), 2),
          styles: sampleSize(Object.values(KompassiGameStyle), 2),
          short_blurb: faker.lorem.sentence(),
          revolving_door: Math.random() < 0.5,
          content_warnings: "Content warning",
          other_author: "Other author",
          ropecon2018_characters: 6,
          ropecon2021_accessibility_loud_sounds: Math.random() < 0.5,
          ropecon2021_accessibility_flashing_lights: Math.random() < 0.5,
          ropecon2021_accessibility_strong_smells: Math.random() < 0.5,
          ropecon2021_accessibility_irritate_skin: Math.random() < 0.5,
          ropecon2021_accessibility_physical_contact: Math.random() < 0.5,
          ropecon2021_accessibility_low_lightning: Math.random() < 0.5,
          ropecon2021_accessibility_moving_around: Math.random() < 0.5,
          ropecon2021_accessibility_video: Math.random() < 0.5,
          ropecon2021_accessibility_recording: Math.random() < 0.5,
          ropecon2021_accessibility_text: Math.random() < 0.5,
          ropecon2021_accessibility_colourblind: Math.random() < 0.5,
          ropecon2022_accessibility_remaining_one_place: Math.random() < 0.5,
          ropecon2022_content_warnings: "Content warning",
          ropecon2021_accessibility_inaccessibility: "Other inaccessibility",
          type_of_game_program:
            programType === KompassiProgramType.BOARD_GAME
              ? TOURNAMENT_EVENT_TYPE
              : "",
          entry_fee: workshopProgramTypes.includes(programType) ? 5 : 0,
        };

        logger.info(`Stored game "${kompassiGameData.title}"`);
        kompassiGames.push(kompassiGameData);
      }
    });
  });

  return await saveGames(kompassiGameMapper(kompassiGames));
};
