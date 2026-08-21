import { Fragment, ReactElement } from "react";
import { capitalize, groupBy } from "remeda";
import { config } from "shared/config";
import { getWeekdayAndTime } from "shared/utils/timeFormatter";
import { useLocale } from "client/utils/useLocale";
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
  const locale = useLocale();

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
            {capitalize(getWeekdayAndTime(startTime, locale))}
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
