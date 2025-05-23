import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { sample } from "remeda";
import { logger } from "server/utils/logger";
import { kompassiProgramItemMapper } from "server/kompassi/kompassiProgramItemMapper";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { config } from "shared/config";
import {
  KompassiProgramItem,
  KompassiPlaystyle,
  KompassiLanguage,
  KompassiAudience,
  KompassiAccessibility,
  KompassiTopic,
  KompassiKonstiProgramType,
} from "server/kompassi/kompassiProgramItem";
import { Result } from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";
import { ProgramType } from "shared/types/models/programItem";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";

const PROGRAM_ITEM_ID_MAX = 10000000;

const startTimes = [
  dayjs(config.event().eventStartTime).toISOString(),
  dayjs(config.event().eventStartTime).add(1, "hours").toISOString(),
  dayjs(config.event().eventStartTime).add(2, "hours").toISOString(),
  dayjs(config.event().eventStartTime).add(3, "hours").toISOString(),
  dayjs(config.event().eventStartTime).add(4, "hours").toISOString(),
  dayjs(config.event().eventStartTime).add(1, "days").toISOString(),
  dayjs(config.event().eventStartTime).add(2, "days").toISOString(),
];

const getMinAttendees = (programType: KompassiKonstiProgramType): number => {
  if (programType === KompassiKonstiProgramType.TOURNAMENT) {
    return faker.number.int({ min: 6, max: 10 });
  }

  if (programType === KompassiKonstiProgramType.WORKSHOP) {
    return 1;
  }

  return faker.number.int({ min: 2, max: 3 });
};

const getMaxAttendees = (programType: KompassiKonstiProgramType): number => {
  if (programType === KompassiKonstiProgramType.TOURNAMENT) {
    return faker.number.int({ min: 12, max: 20 });
  }

  if (programType === KompassiKonstiProgramType.WORKSHOP) {
    return faker.number.int({ min: 12, max: 20 });
  }

  return faker.number.int({ min: 3, max: 4 });
};

const getTopics = (): KompassiTopic[] => {
  const topics: KompassiTopic[] = [];

  if (Math.random() < 0.1) {
    topics.push(KompassiTopic.GOH);
  }

  if (Math.random() < 0.1) {
    topics.push(KompassiTopic.THEME);
  }

  return topics;
};

const mapKonstiProgramTypeToKompassiProgramType = (
  programTypes: ProgramType[],
): KompassiKonstiProgramType[] => {
  return programTypes.map((programType) => {
    switch (programType) {
      case ProgramType.TABLETOP_RPG:
        return KompassiKonstiProgramType.TABLETOP_RPG;

      case ProgramType.LARP:
        return KompassiKonstiProgramType.LARP;

      case ProgramType.TOURNAMENT:
        return KompassiKonstiProgramType.TOURNAMENT;

      case ProgramType.WORKSHOP:
        return KompassiKonstiProgramType.WORKSHOP;

      case ProgramType.EXPERIENCE_POINT:
        return KompassiKonstiProgramType.EXPERIENCE_POINT;

      case ProgramType.OTHER:
        return KompassiKonstiProgramType.OTHER;

      case ProgramType.FLEAMARKET:
        return KompassiKonstiProgramType.FLEAMARKET;

      case ProgramType.ROUNDTABLE_DISCUSSION:
        return KompassiKonstiProgramType.ROUNDTABLE_DISCUSSION;

      default:
        return exhaustiveSwitchGuard(programType);
    }
  });
};

export const createProgramItems = async (
  programItemCount: number,
): Promise<Result<void, MongoDbError>> => {
  const kompassiProgramItems: KompassiProgramItem[] = [];

  const kompassiProgramTypes = mapKonstiProgramTypeToKompassiProgramType(
    config.event().activeProgramTypes,
  );

  kompassiProgramTypes.map((kompassiProgramType) => {
    logger.info(
      `Generate data for ${programItemCount} programs of type ${kompassiProgramType} for ${startTimes.length} start times`,
    );

    for (const startTime of startTimes) {
      for (let i = 0; i < programItemCount; i += 1) {
        const length = 180;
        const slug = faker.number.int(PROGRAM_ITEM_ID_MAX).toString();
        const title = faker.word.words(3);

        const kompassiProgramItemData: KompassiProgramItem = {
          slug,
          title,
          description: faker.lorem.sentences(5),
          cachedHosts: faker.internet.username(),
          cachedDimensions: {
            date: [""],
            room: [""],
            type: [""],
            topic: getTopics(),
            konsti: [kompassiProgramType],
            audience: sample(Object.values(KompassiAudience), 3),
            language: sample(Object.values(KompassiLanguage), 1),
            accessibility: sample(Object.values(KompassiAccessibility), 3),
            playstyle: sample(Object.values(KompassiPlaystyle), 2),
          },
          scheduleItems: [
            {
              slug,
              title,
              startTime: dayjs(startTime).toISOString(),
              endTime: dayjs(startTime).add(length, "minutes").toISOString(),
              lengthMinutes: length,
              location: "Ropetaverna",
            },
          ],
          cachedAnnotations: {
            "konsti:rpgSystem":
              kompassiProgramType === KompassiKonstiProgramType.TABLETOP_RPG
                ? "Test gamesystem"
                : "",
            "ropecon:otherAuthor": "Other author",
            "konsti:minAttendance": getMinAttendees(kompassiProgramType),
            "konsti:maxAttendance": getMaxAttendees(kompassiProgramType),
            "ropecon:numCharacters": 6,
            "konsti:workshopFee":
              kompassiProgramType === KompassiKonstiProgramType.WORKSHOP
                ? "5€"
                : "",
            "ropecon:contentWarnings": "Content warning",
            "ropecon:accessibilityOther": "Other accessibility information",
            "ropecon:gameSlogan": faker.lorem.sentence(),
            "ropecon:isRevolvingDoor": Math.random() < 0.5,
            "konsti:isPlaceholder": Math.random() < 0.1,
          },
        };

        logger.info(`Stored program item ${kompassiProgramItemData.title}`);
        kompassiProgramItems.push(kompassiProgramItemData);
      }
    }
  });

  return await saveProgramItems(
    kompassiProgramItemMapper(kompassiProgramItems),
  );
};
