import { faker } from "@faker-js/faker";
import { addDays, addHours, addMinutes } from "date-fns";
import { sample } from "remeda";
import { config } from "shared/config";
import { MongoDbError } from "shared/types/api/errors";
import { Result } from "shared/utils/result";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { mapKonstiProgramTypesToKompassiProgramTypes } from "server/kompassi/getProgramItemsFromKompassi";
import {
  KompassiAgeGroup,
  KompassiBoolean,
  KompassiGamestyle,
  KompassiGrouping,
  KompassiInclusivity,
  KompassiKonstiProgramType,
  KompassiLanguage,
  KompassiProgramItem,
  KompassiRegistration,
  KompassiYesNo,
} from "server/kompassi/kompassiProgramItem";
import { kompassiProgramItemMapper } from "server/kompassi/kompassiProgramItemMapper";
import { logger } from "server/utils/logger";

const PROGRAM_ITEM_ID_MAX = 10000000;

const startTimes = [
  new Date(config.event().eventStartTime).toISOString(),
  addHours(new Date(config.event().eventStartTime), 1).toISOString(),
  addHours(new Date(config.event().eventStartTime), 2).toISOString(),
  addHours(new Date(config.event().eventStartTime), 3).toISOString(),
  addHours(new Date(config.event().eventStartTime), 4).toISOString(),
  addDays(new Date(config.event().eventStartTime), 1).toISOString(),
  addDays(new Date(config.event().eventStartTime), 2).toISOString(),
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

const getRegistration = (): KompassiRegistration[] => {
  if (Math.random() < 0.1) {
    sample(Object.values(KompassiRegistration), 1);
  }
  return [KompassiRegistration.KONSTI];
};

export const createProgramItems = async (
  programItemCount: number,
): Promise<Result<void, MongoDbError>> => {
  const kompassiProgramItems: KompassiProgramItem[] = [];

  const kompassiProgramTypes = mapKonstiProgramTypesToKompassiProgramTypes(
    config.event().activeProgramTypes,
  );

  for (const kompassiProgramType of kompassiProgramTypes) {
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
          isCancelled: false,
          cachedDimensions: {
            konsti: [kompassiProgramType],
            grouping: sample(Object.values(KompassiGrouping), 1),
            language: sample(Object.values(KompassiLanguage), 1),
            ["age-group"]: sample(Object.values(KompassiAgeGroup), 1),
            ["game-style"]: sample(Object.values(KompassiGamestyle), 2),
            inclusivity: sample(Object.values(KompassiInclusivity), 3),
            registration: getRegistration(),
            revolvingdoor: sample(Object.values(KompassiBoolean), 1),
            room: ["Ropetaverna"],
            ["is-pre-convention-week"]: [KompassiYesNo.NO],
            ["uses-gen-ai"]: [KompassiYesNo.NO],
          },
          scheduleItems: [
            {
              slug,
              title,
              startTime: new Date(startTime).toISOString(),
              endTime: addMinutes(new Date(startTime), length).toISOString(),
              lengthMinutes: length,
              location: "Ropetaverna",
              isCancelled: false,
              cachedAnnotations: {
                "konsti:maxAttendance": getMaxAttendees(kompassiProgramType),
              },
            },
          ],
          cachedAnnotations: {
            "konsti:rpgSystem":
              kompassiProgramType === KompassiKonstiProgramType.TABLETOP_RPG
                ? "Test gamesystem"
                : "",
            "ropecon:otherAuthor": "Other author",
            "konsti:minAttendance": getMinAttendees(kompassiProgramType),
            "ropecon:numCharacters": 6,
            "konsti:workshopFee":
              kompassiProgramType === KompassiKonstiProgramType.WORKSHOP
                ? "5€"
                : "",
            "konsti:entryConditionK16": false,
            "ropecon:contentWarnings": "Content warning",
            "ropecon:accessibilityOther": "Other accessibility information",
            "ropecon:gameSlogan": faker.lorem.sentence(),
            "ropecon:isRevolvingDoor": Math.random() < 0.5,
            "konsti:isPlaceholder": Math.random() < 0.1,
          },
        };

        logger.info(
          `Stored ${kompassiProgramType} program item ${kompassiProgramItemData.title}`,
        );
        kompassiProgramItems.push(kompassiProgramItemData);
      }
    }
  }

  return await saveProgramItems(
    kompassiProgramItemMapper(kompassiProgramItems),
  );
};
