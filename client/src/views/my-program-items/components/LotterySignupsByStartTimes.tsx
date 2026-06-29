import { Fragment, ReactElement } from "react";
import { capitalize, groupBy } from "remeda";
import { getWeekdayAndTime } from "shared/utils/timeFormatter";
import {
  MyProgramList,
  MyProgramTime,
} from "client/views/my-program-items/components/shared";
import { LotterySignupWithProgramItem } from "client/views/my-program-items/myProgramItemsSlice";
import { config } from "shared/config";
import { LotterySignupItem } from "client/views/my-program-items/components/LotterySignupItem";

interface Props {
  lotterySignups: LotterySignupWithProgramItem[];
}

export const LotterySignupsByStartTimes = ({
  lotterySignups,
}: Props): ReactElement => {
  const groupedLotterySignups = groupBy(lotterySignups, (lotterySignup) => {
    const parentStartTime = config
      .event()
      .startTimesByParentIds.get(lotterySignup.programItem.parentId);
    return parentStartTime ?? lotterySignup.signedToStartTime;
  });

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
