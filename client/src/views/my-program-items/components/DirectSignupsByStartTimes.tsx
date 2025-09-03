import { ReactElement } from "react";
import { capitalize } from "remeda";
import { getWeekdayAndTime } from "shared/utils/timeFormatter";
import { DirectSignupItem } from "client/views/my-program-items/components/DirectSignupItem";
import {
  MyProgramList,
  MyProgramTime,
} from "client/views/my-program-items/components/shared";
import { DirectSignupWithProgramItem } from "client/views/my-program-items/myProgramItemsSlice";

interface Props {
  directSignups: readonly DirectSignupWithProgramItem[];
  startTimes: readonly string[];
}

export const DirectSignupsByStartTimes = ({
  directSignups,
  startTimes,
}: Props): ReactElement => {
  return (
    <>
      {startTimes.map((startTime) => {
        return (
          <div key={startTime}>
            <MyProgramTime>
              {capitalize(getWeekdayAndTime(startTime))}
            </MyProgramTime>

            <MyProgramList>
              {directSignups.map((signup) => {
                return (
                  <DirectSignupItem
                    key={signup.programItemId}
                    signup={signup}
                    startTime={startTime}
                  />
                );
              })}
            </MyProgramList>
          </div>
        );
      })}
    </>
  );
};
