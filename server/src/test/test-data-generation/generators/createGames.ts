import faker from "@faker-js/faker";
import moment from "moment";
import { logger } from "server/utils/logger";
import { kompassiGameMapper } from "server/utils/kompassiGameMapper";
import { KompassiGame } from "server/typings/game.typings";
import { Game } from "shared/typings/models/game";
import { saveGames } from "server/features/game/gameRepository";
import { sharedConfig } from "shared/config/sharedConfig";
import { KompassiProgramType } from "shared/constants/kompassiProgramType";

const GAME_ID_MAX = 10000000;

export const createGames = async (
  gameCount: number,
  signupTimes: number
): Promise<Game[]> => {
  const startingTimes = [] as string[];

  for (let i = 0; i < signupTimes; i += 1) {
    startingTimes.push(
      moment(sharedConfig.CONVENTION_START_TIME)
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
      const minAttendance = faker.datatype.number({ min: 3, max: 4 });
      const maxAttendance = faker.datatype.number({ min: 4, max: 6 });
      const startTime = startingTime;
      const length = 180;

      const kompassiGameData = {
        title: faker.random.words(3),
        description: faker.lorem.sentences(5),
        category_title: KompassiProgramType.TABLETOP_RPG,
        formatted_hosts: faker.internet.userName(),
        room_name: "Ropetaverna",
        length,
        start_time: moment(startTime).format(),
        end_time: moment(startTime).add(length, "minutes").format(),
        language: "fi",
        rpg_system: "Test gamesystem",
        no_language: true,
        english_ok: true,
        children_friendly: true,
        age_restricted: true,
        beginner_friendly: true,
        intended_for_experienced_participants: true,
        min_players: minAttendance,
        max_players: maxAttendance,
        identifier: faker.datatype.number(GAME_ID_MAX).toString(),
        tags: [
          "in-english",
          "sopii-lapsille",
          "vain-taysi-ikaisille",
          "aloittelijaystavallinen",
          "kunniavieras",
          "perheohjelma",
        ],
        genres: ["fantasy", "war", "exploration", "mystery", "drama"],
        styles: ["serious", "story_driven", "character_driven"],
        short_blurb: faker.lorem.sentence(),
        revolving_door: true,
        three_word_description: "This is example ",
        is_beginner_friendly: true,
        content_warnings: "",
        other_author: "",
        ropecon2018_characters: 6,
        ropecon2021_accessibility_loud_sounds: false,
        ropecon2021_accessibility_flashing_lights: false,
        ropecon2021_accessibility_strong_smells: false,
        ropecon2021_accessibility_irritate_skin: false,
        ropecon2021_accessibility_physical_contact: false,
        ropecon2021_accessibility_low_lightning: false,
        ropecon2021_accessibility_moving_around: false,
        ropecon2021_accessibility_video: false,
        ropecon2021_accessibility_recording: false,
        ropecon2021_accessibility_text: false,
        ropecon2021_accessibility_colourblind: false,
      };

      logger.info(`Stored game "${kompassiGameData.title}"`);
      kompassiGames.push(kompassiGameData);
    }
  });

  return await saveGames(kompassiGameMapper(kompassiGames));
};
