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
} from "shared/typings/models/kompassiGame";

const GAME_ID_MAX = 10000000;

export const createGames = async (
  gameCount: number,
  signupTimes: number
): Promise<Game[]> => {
  const startingTimes = [] as string[];

  for (let i = 0; i < signupTimes; i += 1) {
    startingTimes.push(
      dayjs(sharedConfig.CONVENTION_START_TIME)
        .add(i + 2, "hours")
        .format()
    );
  }

  logger.info(
    `Generate data for ${gameCount} games for ${signupTimes} starting times`
  );

  const kompassiGames = [] as KompassiGame[];

  startingTimes.forEach((startingTime) => {
    for (let i = 0; i < gameCount; i += 1) {
      const startTime = startingTime;
      const length = 180;

      const kompassiGameData = {
        title: faker.random.words(3),
        description: faker.lorem.sentences(5),
        category_title: KompassiProgramType.TABLETOP_RPG,
        formatted_hosts: faker.internet.userName(),
        room_name: "Ropetaverna",
        length,
        start_time: dayjs(startTime).format(),
        end_time: dayjs(startTime).add(length, "minutes").format(),
        language: "fi",
        rpg_system: "Test gamesystem",
        no_language: Math.random() < 0.5,
        english_ok: Math.random() < 0.5,
        children_friendly: Math.random() < 0.5,
        age_restricted: Math.random() < 0.5,
        beginner_friendly: Math.random() < 0.5,
        intended_for_experienced_participants: Math.random() < 0.5,
        is_beginner_friendly: Math.random() < 0.5,
        min_players: faker.datatype.number({ min: 2, max: 3 }),
        max_players: faker.datatype.number({ min: 3, max: 4 }),
        identifier: faker.datatype.number(GAME_ID_MAX).toString(),
        tags: sampleSize(Object.values(KompassiTag), 3),
        genres: sampleSize(Object.values(KompassiGenre), 2),
        styles: sampleSize(Object.values(KompassiGameStyle), 2),
        short_blurb: faker.lorem.sentence(),
        revolving_door: Math.random() < 0.5,
        three_word_description: "This is example ",
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
        type_of_game_program: "",
      };

      logger.info(`Stored game "${kompassiGameData.title}"`);
      kompassiGames.push(kompassiGameData);
    }
  });

  return await saveGames(kompassiGameMapper(kompassiGames));
};
