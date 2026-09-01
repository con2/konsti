import { Fragment, ReactElement } from "react";
import { capitalize, groupBy } from "remeda";
import { getProgramItemStartTime } from "shared/utils/signupTimes";
import { useTimeFormatters } from "client/utils/useTimeFormatters";
import { LotterySignupItem } from "client/views/my-program-items/components/LotterySignupItem";
import {
  MyProgramList,
  MyProgramTime,
} from "client/views/my-program-items/components/shared";
import { LotterySignupWithProgramItem } from "client/views/my-program-items/myProgramItemsSlice";

interface Props {
  lotterySignups: LotterySignupWithProgramItem[];
}

export const LotterySignupsByStartTimes = ({
  lotterySignups,
}: Props): ReactElement => {
  const { getWeekdayAndTime } = useTimeFormatters();

  // Grouped by the hour the lottery covers, which for a batched program item is the batch's own -
  // one heading over the ranking the attendee made for that run
  const groupedLotterySignups = groupBy(lotterySignups, (lotterySignup) =>
    getProgramItemStartTime(lotterySignup.programItem),
  );

  return (
    <>
      {Object.entries(groupedLotterySignups).map(([startTime, signups]) => (
        <Fragment key={startTime}>
          <MyProgramTime>
            {capitalize(getWeekdayAndTime(startTime))}
          </MyProgramTime>

          <MyProgramList>
            {signups.map((signup) => (
              <LotterySignupItem
                lotterySignup={signup}
                key={signup.programItemId}
              />
            ))}
          </MyProgramList>
        </Fragment>
      ))}
    </>
  );
};
