import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { capitalize } from "lodash-es";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { Signup } from "shared/types/models/user";
import { DirectSignupItem } from "client/views/my-program-items/components/DirectSignupItem";
import {
  MyProgramList,
  MyProgramTime,
} from "client/views/my-program-items/components/shared";

interface Props {
  directSignups: readonly Signup[];
  startTimes: readonly string[];
  missedSignups: readonly string[];
}

export const DirectSignupsByStartTimes = ({
  directSignups,
  startTimes,
  missedSignups,
}: Props): ReactElement => {
  const { t } = useTranslation();

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
                    key={signup.programItem.programItemId}
                    signup={signup}
                    startTime={startTime}
                  />
                );
              })}

              {missedSignups.map((missedSignup) => {
                if (missedSignup === startTime) {
                  return (
                    <NoSignupText key={missedSignup}>
                      {t("noLotterySignupResult")}
                    </NoSignupText>
                  );
                }
              })}
            </MyProgramList>
          </div>
        );
      })}
    </>
  );
};

const NoSignupText = styled.p`
  color: ${(props) => props.theme.textSecondary};
`;
