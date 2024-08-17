import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { sampleSize } from "lodash-es";
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
} from "server/kompassi/kompassiProgramItem";
import { Result } from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";
import { KompassiKonstiProgramType } from "server/kompassi/kompassiProgramItem";

const PROGRAM_ITEM_ID_MAX = 10000000;

const startTimes = [
  dayjs(config.event().conventionStartTime).toISOString(),
  dayjs(config.event().conventionStartTime).add(1, "hours").toISOString(),
  dayjs(config.event().conventionStartTime).add(2, "hours").toISOString(),
  dayjs(config.event().conventionStartTime).add(3, "hours").toISOString(),
  dayjs(config.event().conventionStartTime).add(4, "hours").toISOString(),
  dayjs(config.event().conventionStartTime).add(1, "days").toISOString(),
  dayjs(config.event().conventionStartTime).add(2, "days").toISOString(),
];

const getMinAttendees = (programType: KompassiKonstiProgramType): number => {
  if (programType === KompassiKonstiProgramType.TOURNAMENT) {
    return faker.number.int({ min: 6, max: 10 });
  }

  if (programType === KompassiKonstiProgramType.WORKSHOP) {
    return 0;
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

export const createProgramItems = async (
  programItemCount: number,
): Promise<Result<void, MongoDbError>> => {
  const kompassiProgramItems: KompassiProgramItem[] = [];

  const programTypes = [
    KompassiKonstiProgramType.TABLETOP_RPG,
    KompassiKonstiProgramType.LARP,
    KompassiKonstiProgramType.TOURNAMENT,
    KompassiKonstiProgramType.WORKSHOP,
  ];

  programTypes.map((programType) => {
    logger.info(
      `Generate data for ${programItemCount} programs of type ${programType} for ${startTimes.length} start times`,
    );

    startTimes.forEach((startTime) => {
      for (let i = 0; i < programItemCount; i += 1) {
        const length = 180;
        const title = faker.word.words(3);

        const kompassiProgramItemData: KompassiProgramItem = {
          slug: faker.number.int(PROGRAM_ITEM_ID_MAX).toString(),
          title,
          description: faker.lorem.sentences(5),
          cachedHosts: faker.internet.userName(),
          cachedDimensions: {
            date: [""],
            room: [""],
            type: [""],
            topic: getTopics(),
            konsti: [programType],
            audience: sampleSize(Object.values(KompassiAudience), 3),
            language: sampleSize(Object.values(KompassiLanguage), 1),
            accessibility: sampleSize(Object.values(KompassiAccessibility), 3),
            playstyle: sampleSize(Object.values(KompassiPlaystyle), 2),
          },
          scheduleItems: [
            {
              title,
              startTime: dayjs(startTime).toISOString(),
              endTime: dayjs(startTime).add(length, "minutes").toISOString(),
              lengthMinutes: length,
              location: "Ropetaverna",
            },
          ],
          cachedAnnotations: {
            "konsti:rpgSystem":
              programType === KompassiKonstiProgramType.TABLETOP_RPG
                ? "Test gamesystem"
                : "",
            "ropecon:otherAuthor": "Other author",
            "konsti:minAttendance": getMinAttendees(programType),
            "konsti:maxAttendance": getMaxAttendees(programType),
            "ropecon:numCharacters": 6,
            "konsti:workshopFee":
              programType === KompassiKonstiProgramType.WORKSHOP ? "5€" : "",
            "ropecon:contentWarnings": "Content warning",
            "ropecon:accessibilityOther": "Other accessibility information",
            "ropecon:gameSlogan": faker.lorem.sentence(),
            "ropecon:isRevolvingDoor": Math.random() < 0.5,
          },
        };

        logger.info(`Stored program item ${kompassiProgramItemData.title}`);
        kompassiProgramItems.push(kompassiProgramItemData);
      }
    });
  });

  return await saveProgramItems(
    kompassiProgramItemMapper(kompassiProgramItems),
  );
};
