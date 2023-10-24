import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import _ from "lodash";
import { logger } from "server/utils/logger";
import { kompassiGameMapper } from "server/utils/kompassiGameMapper";
import { saveGames } from "server/features/game/gameRepository";
import { config } from "shared/config";
import {
  KompassiGame,
  KompassiGameStyle,
  KompassiGenre,
  KompassiLanguage,
  KompassiProgramType,
  KompassiSignupType,
  KompassiTag,
  tournamentProgramTypes,
  workshopProgramTypes,
} from "shared/typings/models/kompassiGame/kompassiGameRopecon";
import { Result } from "shared/utils/result";
import { MongoDbError } from "shared/typings/api/errors";

const GAME_ID_MAX = 10000000;

const startTimes = [
  dayjs(config.shared().CONVENTION_START_TIME).toISOString(),
  dayjs(config.shared().CONVENTION_START_TIME).add(1, "hours").toISOString(),
  dayjs(config.shared().CONVENTION_START_TIME).add(2, "hours").toISOString(),
  dayjs(config.shared().CONVENTION_START_TIME).add(3, "hours").toISOString(),
  dayjs(config.shared().CONVENTION_START_TIME).add(4, "hours").toISOString(),
  dayjs(config.shared().CONVENTION_START_TIME).add(1, "days").toISOString(),
  dayjs(config.shared().CONVENTION_START_TIME).add(2, "days").toISOString(),
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

const getProgramType = (
  programType: KompassiProgramType,
): KompassiProgramType => {
  if (programType === KompassiProgramType.TOURNAMENT_BOARD_GAME) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know tournamentProgramTypes is valid array
    return _.sample(tournamentProgramTypes)!;
  }

  if (programType === KompassiProgramType.WORKSHOP_MINIATURE) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know tournamentProgramTypes is valid array
    return _.sample(workshopProgramTypes)!;
  }

  return programType;
};

export const createGames = async (
  gameCount: number,
): Promise<Result<void, MongoDbError>> => {
  const kompassiGames: KompassiGame[] = [];

  const programTypes = [
    KompassiProgramType.TABLETOP_RPG,
    KompassiProgramType.LARP,
    KompassiProgramType.TOURNAMENT_BOARD_GAME,
    KompassiProgramType.WORKSHOP_MINIATURE,
  ];

  programTypes.map((programType) => {
    logger.info(
      `Generate data for ${gameCount} programs of type ${programType} for ${startTimes.length} start times`,
    );

    startTimes.forEach((startTime) => {
      for (let i = 0; i < gameCount; i += 1) {
        const length = 180;

        const kompassiGameData: KompassiGame = {
          title: faker.word.words(3),
          description: faker.lorem.sentences(5),
          category_title: getProgramType(programType),
          formatted_hosts: faker.internet.userName(),
          room_name: "Ropetaverna",
          length,
          start_time: dayjs(startTime).toISOString(),
          end_time: dayjs(startTime).add(length, "minutes").toISOString(),
          rpg_system:
            programType === KompassiProgramType.TABLETOP_RPG
              ? "Test gamesystem"
              : "",
          min_players: getMinPlayers(programType),
          max_players: getMaxPlayers(programType),
          identifier: faker.number.int(GAME_ID_MAX).toString(),
          tags: _.sampleSize(Object.values(KompassiTag), 3),
          genres: _.sampleSize(Object.values(KompassiGenre), 2),
          styles: _.sampleSize(Object.values(KompassiGameStyle), 2),
          short_blurb: faker.lorem.sentence(),
          revolving_door: Math.random() < 0.5,
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
          ropecon2021_accessibility_colourblind: Math.random() < 0.5,
          ropecon2022_accessibility_remaining_one_place: Math.random() < 0.5,
          ropecon2022_content_warnings: "Content warning",
          ropecon2023_accessibility_cant_use_mic: Math.random() < 0.5,
          ropecon2023_accessibility_programme_duration_over_2_hours:
            Math.random() < 0.5,
          ropecon2023_accessibility_limited_opportunities_to_move_around:
            Math.random() < 0.5,
          ropecon2023_accessibility_long_texts: Math.random() < 0.5,
          ropecon2023_accessibility_texts_not_available_as_recordings:
            Math.random() < 0.5,
          ropecon2023_accessibility_participation_requires_dexterity:
            Math.random() < 0.5,
          ropecon2023_accessibility_participation_requires_react_quickly:
            Math.random() < 0.5,
          ropecon2023_other_accessibility_information:
            "Other accessibility information",
          ropecon2023_signuplist: KompassiSignupType.KONSTI,
          ropecon2023_workshop_fee: workshopProgramTypes.includes(programType)
            ? "5€"
            : "",
          ropecon2023_language: KompassiLanguage.FINNISH,
          ropecon2023_suitable_for_all_ages: Math.random() < 0.5,
          ropecon2023_aimed_at_children_under_13: Math.random() < 0.5,
          ropecon2023_aimed_at_children_between_13_17: Math.random() < 0.5,
          ropecon2023_aimed_at_adult_attendees: Math.random() < 0.5,
          ropecon2023_for_18_plus_only: Math.random() < 0.5,
          ropecon2023_beginner_friendly: Math.random() < 0.5,
          ropecon_theme: Math.random() < 0.5,
          ropecon2023_celebratory_year: Math.random() < 0.5,
        };

        logger.info(`Stored game ${kompassiGameData.title}`);
        kompassiGames.push(kompassiGameData);
      }
    });
  });

  return await saveGames(kompassiGameMapper(kompassiGames));
};
