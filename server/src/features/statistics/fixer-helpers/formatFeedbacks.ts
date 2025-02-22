import fs from "node:fs";
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

  const programItemsJson = fs.readFileSync(
    `${config.server().statsDataDir}/${event}/${year}/program-items.json`,
    "utf8",
  );
  const programItems = z
    .array(ProgramItemSchema)
    .parse(JSON.parse(programItemsJson));

  logger.info(`Loaded ${programItems.length} program items`);

  const filteredFeedbacks = feedbacks.filter(
    (feedback) => feedback.feedback !== "",
  );

  logger.info(
    `Removed ${feedbacks.length - filteredFeedbacks.length} empty feedbacks, ${
      filteredFeedbacks.length
    } remaining`,
  );

  const formattedFeedbacks = filteredFeedbacks.map((feedback) => {
    const foundProgramItem = programItems.find(
      (programItem) => programItem.programItemId === feedback.programItemId,
    );
    return {
      feedback: feedback.feedback,
      programItem: foundProgramItem?.title,
      organizer: foundProgramItem?.people,
      // eslint-disable-next-line no-restricted-syntax -- We want to call format here
      startTime: dayjs(foundProgramItem?.startTime)
        .tz(TIMEZONE)
        .format("dddd HH:mm"),
      programType: foundProgramItem?.programType,
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

      // @ts-expect-error: FIXME FIXME
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
