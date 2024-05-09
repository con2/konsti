import fs from "fs";
import { groupBy } from "lodash-es";
import dayjs from "dayjs";
import { z } from "zod";
import { logger } from "server/utils/logger";
import { ProgramItemSchema } from "shared/types/models/programItem";
import { Message, writeFeedback } from "server/features/statistics/statsUtil";
import { PostFeedbackRequestSchema } from "shared/types/api/feedback";
import { config } from "shared/config";
import { setLocale } from "shared/utils/setLocale";
import { TIMEZONE } from "shared/utils/initializeDayjs";

export const formatFeedbacks = (year: number, event: string): void => {
  setLocale("fi");

  const feedbacksJson = fs.readFileSync(
    `${config.server().statsDataDir}/${event}/${year}/secret/feedbacks.json`,
    "utf8",
  );

  const feedbacks = z
    .array(PostFeedbackRequestSchema)
    .parse(JSON.parse(feedbacksJson));

  logger.info(`Loaded ${feedbacks.length} feedbacks`);

  const gamesJson = fs.readFileSync(
    `${config.server().statsDataDir}/${event}/${year}/games.json`,
    "utf8",
  );
  const games = z.array(ProgramItemSchema).parse(JSON.parse(gamesJson));

  logger.info(`Loaded ${games.length} games`);

  const filteredFeedbacks = feedbacks.filter(
    (feedback) => feedback.feedback !== "",
  );

  logger.info(
    `Removed ${feedbacks.length - filteredFeedbacks.length} empty feedbacks, ${
      filteredFeedbacks.length
    } remaining`,
  );

  const formattedFeedbacks = filteredFeedbacks.map((feedback) => {
    const foundGame = games.find(
      (game) => game.programItemId === feedback.programItemId,
    );
    return {
      feedback: feedback.feedback,
      game: foundGame?.title,
      organizer: foundGame?.people,
      // eslint-disable-next-line no-restricted-syntax -- We want to call format here
      startTime: dayjs(foundGame?.startTime).tz(TIMEZONE).format("dddd HH:mm"),
      programType: foundGame?.programType,
    };
  });

  logger.info(`Formatted ${formattedFeedbacks.length} feedbacks`);

  const groupedByProgramTypeFeedbacks = groupBy(
    formattedFeedbacks,
    (feedback) => feedback.programType,
  );

  Object.entries(groupedByProgramTypeFeedbacks).map(
    ([programType, programTypeFeedbacks]) => {
      logger.info(
        `${programType}: found ${programTypeFeedbacks.length} feedbacks`,
      );

      // @ts-expect-error: FIXME
      const groupedByOrganizerFeedbacks: Record<string, Message[]> = groupBy(
        programTypeFeedbacks,
        (feedback) => feedback.organizer,
      );

      logger.info(
        `${programType}: grouped to ${
          Object.entries(groupedByOrganizerFeedbacks).length
        } organizers`,
      );

      writeFeedback(
        year,
        event,
        `feedback-${programType}`,
        groupedByOrganizerFeedbacks,
      );
    },
  );
};
