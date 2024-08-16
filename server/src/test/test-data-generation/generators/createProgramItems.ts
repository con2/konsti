import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { sampleSize } from "lodash-es";
import { logger } from "server/utils/logger";
import { kompassiProgramItemMapperRopecon } from "server/kompassi/ropecon/kompassiProgramItemMapperRopecon";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { config } from "shared/config";
import {
  KompassiProgramItemRopecon,
  KompassiPlaystyleRopecon,
  KompassiLanguageRopecon,
  KompassiKonstiProgramTypeRopecon,
  KompassiAudienceRopecon,
  KompassiAccessibilityRopecon,
  KompassiTopicRopecon,
} from "server/kompassi/ropecon/kompassiProgramItemRopecon";
import { Result } from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";

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

const getMinAttendees = (
  programType: KompassiKonstiProgramTypeRopecon,
): number => {
  if (programType === KompassiKonstiProgramTypeRopecon.TOURNAMENT) {
    return faker.number.int({ min: 6, max: 10 });
  }

  if (programType === KompassiKonstiProgramTypeRopecon.WORKSHOP) {
    return 0;
  }

  return faker.number.int({ min: 2, max: 3 });
};

const getMaxAttendees = (
  programType: KompassiKonstiProgramTypeRopecon,
): number => {
  if (programType === KompassiKonstiProgramTypeRopecon.TOURNAMENT) {
    return faker.number.int({ min: 12, max: 20 });
  }

  if (programType === KompassiKonstiProgramTypeRopecon.WORKSHOP) {
    return faker.number.int({ min: 12, max: 20 });
  }

  return faker.number.int({ min: 3, max: 4 });
};

const getTopics = (): KompassiTopicRopecon[] => {
  const topics: KompassiTopicRopecon[] = [];

  if (Math.random() < 0.1) {
    topics.push(KompassiTopicRopecon.GOH);
  }

  if (Math.random() < 0.1) {
    topics.push(KompassiTopicRopecon.THEME);
  }

  return topics;
};

export const createProgramItems = async (
  programItemCount: number,
): Promise<Result<void, MongoDbError>> => {
  const kompassiProgramItems: KompassiProgramItemRopecon[] = [];

  const programTypes = [
    KompassiKonstiProgramTypeRopecon.TABLETOP_RPG,
    KompassiKonstiProgramTypeRopecon.LARP,
    KompassiKonstiProgramTypeRopecon.TOURNAMENT,
    KompassiKonstiProgramTypeRopecon.WORKSHOP,
  ];

  programTypes.map((programType) => {
    logger.info(
      `Generate data for ${programItemCount} programs of type ${programType} for ${startTimes.length} start times`,
    );

    startTimes.forEach((startTime) => {
      for (let i = 0; i < programItemCount; i += 1) {
        const length = 180;

        const kompassiProgramItemData: KompassiProgramItemRopecon = {
          slug: faker.number.int(PROGRAM_ITEM_ID_MAX).toString(),
          title: faker.word.words(3),
          description: faker.lorem.sentences(5),
          cachedHosts: faker.internet.userName(),
          cachedDimensions: {
            date: [""],
            room: [""],
            type: [""],
            topic: getTopics(),
            konsti: [programType],
            audience: sampleSize(Object.values(KompassiAudienceRopecon), 3),
            language: sampleSize(Object.values(KompassiLanguageRopecon), 1),
            accessibility: sampleSize(
              Object.values(KompassiAccessibilityRopecon),
              3,
            ),
            playstyle: sampleSize(Object.values(KompassiPlaystyleRopecon), 2),
          },
          scheduleItems: [
            {
              startTime: dayjs(startTime).toISOString(),
              endTime: dayjs(startTime).add(length, "minutes").toISOString(),
              lengthMinutes: length,
              location: "Ropetaverna",
            },
          ],
          cachedAnnotations: {
            "konsti:rpgSystem":
              programType === KompassiKonstiProgramTypeRopecon.TABLETOP_RPG
                ? "Test gamesystem"
                : "",
            "ropecon:otherAuthor": "Other author",
            "konsti:minAttendance": getMinAttendees(programType),
            "konsti:maxAttendance": getMaxAttendees(programType),
            "ropecon:numCharacters": 6,
            "konsti:workshopFee":
              programType === KompassiKonstiProgramTypeRopecon.WORKSHOP
                ? "5€"
                : "",
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
    kompassiProgramItemMapperRopecon(kompassiProgramItems),
  );
};
