import fs from "fs";
import _ from "lodash";
import moment from "moment";
import { z } from "zod";
import { logger } from "server/utils/logger";
import { GameSchema } from "shared/typings/models/game";
import { writeJson } from "server/features/statistics/statsUtil";
import { FeedbackSchema } from "shared/typings/models/feedback";
import { config } from "server/config";

export const formatFeedbacks = (year: number, event: string): void => {
  moment.locale("fi");

  const feedbacksJson = fs.readFileSync(
    `${config.statsDataDir}/${event}/${year}/secret/feedbacks.json`,
    "utf8"
  );

  const feedbacks = z.array(FeedbackSchema).parse(JSON.parse(feedbacksJson));

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
      ...feedback,
      title: foundGame?.title,
      people: foundGame?.people,
      startTime: moment(foundGame?.startTime).format("dddd HH:mm"),
    };
  });

  const groupedFeedbacks = _.groupBy(formattedFeedbacks, "people");

  writeJson(year, event, "feedback", groupedFeedbacks);
};
