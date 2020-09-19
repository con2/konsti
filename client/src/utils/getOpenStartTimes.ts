import moment from 'moment';
import { config } from 'config';
import { getStartTimes } from './getStartTimes';
import { Game } from 'typings/game.typings';
import { getTime } from 'utils/getTime';

export const getOpenStartTimes = (games: readonly Game[]): string[] => {
  const startTimes = getStartTimes(games);

  const {
    // DAY_START_TIME,
    SIGNUP_OPEN_TIME,
    SIGNUP_END_TIME,
    // CONVENTION_START_TIME,
  } = config;

  const timeNow = getTime();

  const earliestSignupTime = moment(timeNow)
    .add(SIGNUP_END_TIME, 'minutes')
    .endOf('hour');

  /*
  if (moment(earliestSignupTime).isBefore(moment(CONVENTION_START_TIME))) {
    earliestSignupTime = moment(CONVENTION_START_TIME)
  } else if (
    moment(earliestSignupTime).isBefore(
      moment(earliestSignupTime).hours(DAY_START_TIME)
    )
  ) {
    earliestSignupTime = moment(earliestSignupTime)
      .hours(DAY_START_TIME)
      .format('HH:mm')
  }
  */

  const minutes = moment(timeNow).format('m');

  const lastSignupTime = moment(timeNow)
    .add(SIGNUP_OPEN_TIME, 'hours')
    .subtract(minutes, 'minutes')
    .startOf('hour');

  const openSignupTimes: string[] = [];
  for (const startTime of startTimes) {
    if (
      moment(startTime).isBetween(
        earliestSignupTime,
        lastSignupTime.add(1, 'minutes')
      )
    ) {
      openSignupTimes.push(startTime);
    }
  }

  return openSignupTimes;
};
