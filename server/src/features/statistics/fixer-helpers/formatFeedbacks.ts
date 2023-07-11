import fs from "fs";
import _ from "lodash";
import dayjs from "dayjs";
import { z } from "zod";
import { logger } from "server/utils/logger";
import { GameSchema } from "shared/typings/models/game";
import { writeJson } from "server/features/statistics/statsUtil";
import { PostFeedbackRequestSchema } from "shared/typings/api/feedback";
import { config } from "server/config";
import { setLocale } from "shared/utils/setLocale";
import { TIMEZONE } from "shared/utils/initializeDayjs";

export const formatFeedbacks = (year: number, event: string): void => {
  setLocale("fi");

  const feedbacksJson = fs.readFileSync(
    `${config.statsDataDir}/${event}/${year}/secret/feedbacks.json`,
    "utf8"
  );

  const feedbacks = z
    .array(PostFeedbackRequestSchema)
    .parse(JSON.parse(feedbacksJson));

  logger.info(`Loaded ${feedbacks.length} feedbacks`);

  const gamesJson = fs.readFileSync(
    `${config.statsDataDir}/${event}/${year}/games.json`,
    "utf8"
  );
  const games = z.array(GameSchema).parse(JSON.parse(gamesJson));

  logger.info(`Loaded ${games.length} games`);

  const filteredFeedbacks = feedbacks.filter(
    (feedback) => feedback.feedback !== ""
  );

  const formattedFeedbacks = filteredFeedbacks.map((feedback) => {
    const foundGame = games.find((game) => game.gameId === feedback.gameId);
    return {
      feedback: feedback.feedback,
      game: foundGame?.title,
      organizer: foundGame?.people,
      startTime: dayjs(foundGame?.startTime).tz(TIMEZONE).format("dddd HH:mm"),
      programType: foundGame?.programType,
    };
  });

  const groupedFeedbacks = _.groupBy(
    formattedFeedbacks,
    (feedback) => feedback.organizer
  );

  writeJson(year, event, "feedback", groupedFeedbacks);
};
