import moment from "moment";
import { sharedConfig } from "shared/config/sharedConfig";
import { getStartTimes } from "./getStartTimes";
import { Game } from "shared/typings/models/game";
import { getTime } from "client/utils/getTime";

export const getOpenStartTimes = (games: readonly Game[]): string[] => {
  const startTimes = getStartTimes(games);

  const { SIGNUP_OPEN_TIME, SIGNUP_END_TIME } = sharedConfig;

  const timeNow = getTime();

  const earliestSignupTime = moment(timeNow)
    .add(SIGNUP_END_TIME, "minutes")
    .endOf("hour");

  const minutes = moment(timeNow).format("m");

  const lastSignupTime = moment(timeNow)
    .add(SIGNUP_OPEN_TIME, "hours")
    .subtract(minutes, "minutes")
    .startOf("hour");

  const openSignupTimes: string[] = [];
  for (const startTime of startTimes) {
    if (
      moment(startTime).isBetween(
        earliestSignupTime,
        lastSignupTime.add(1, "minutes")
      )
    ) {
      openSignupTimes.push(startTime);
    }
  }

  return openSignupTimes;
};
