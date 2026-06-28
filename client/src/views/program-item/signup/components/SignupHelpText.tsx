import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProgramItem } from "shared/types/models/programItem";
import { getTimeNow } from "client/utils/getTimeNow";
import {
  getLotterySignupEndTime,
  getLotterySignupStartTime,
  getDirectSignupStartTime,
  getDirectSignupEndTime,
  getLotterySignupNotStarted,
  getLotterySignupInProgress,
  getDirectSignupInProgress,
  getDirectSignupEnded,
} from "shared/utils/signupTimes";
import {
  getFormattedTime,
  getFormattedInterval,
} from "client/views/program-item/programItemUtils";
import { tooEarlyForLotterySignup } from "shared/utils/tooEarlyForLotterySignup";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { isDirectSignupAlwaysOpen } from "shared/utils/isDirectSignupAlwaysOpen";
import { useAppSelector } from "client/utils/hooks";
import { getIsInGroup } from "client/views/group/groupUtils";

interface Props {
  programItem: ProgramItem;
  usesKonstiSignup: boolean;
}

export const SignupHelpText = ({
  programItem,
  usesKonstiSignup,
}: Props): ReactElement | null => {
  const { t } = useTranslation();

  const groupCode = useAppSelector((state) => state.group.groupCode);
  const isInGroup = getIsInGroup(groupCode);

  // Cannot use programItem.signupStrategy here since it's relative to time
  const isLotterySignup =
    isLotterySignupProgramItem(programItem) &&
    !tooEarlyForLotterySignup(programItem.startTime);

  // Group members can sign up to always open program items without leaving the group
  const groupMemberInfo =
    isDirectSignupAlwaysOpen(programItem) && isInGroup ? (
      <span>{t("signup.help.signupAlwaysOpenGroupMemberInfo")}</span>
    ) : null;

  const timeNow = getTimeNow();

  const lotterySignupStartTime = getLotterySignupStartTime(programItem);
  const lotterySignupEndTime = getLotterySignupEndTime(programItem);
  const lotterySignupNotStarted = getLotterySignupNotStarted(
    programItem,
    timeNow,
  );
  const lotterySignupInProgress = getLotterySignupInProgress(
    programItem,
    timeNow,
  );

  const directSignupEndTime = getDirectSignupEndTime(programItem);
  const directSignupStartTime = getDirectSignupStartTime(programItem);
  const directSignupInProgress = getDirectSignupInProgress(
    programItem,
    timeNow,
  );
  const directSignupEnded = getDirectSignupEnded(programItem, timeNow);

  if (directSignupEnded) {
    return null;
  }

  if (!usesKonstiSignup) {
    return (
      <p>
        {t(`signup.signupType.${programItem.signupType}`, {
          PROGRAM_TYPE: t(`programTypeIllative.${programItem.programType}`),
        })}
      </p>
    );
  }

  if (!isLotterySignup) {
    if (!directSignupInProgress) {
      return (
        <p>
          <FontAwesomeIcon icon={"user-plus"} />{" "}
          {t("signup.help.directSignupStartsLater")}{" "}
          <b>{getFormattedTime(directSignupStartTime, timeNow)}</b>.
          {groupMemberInfo}
        </p>
      );
    }

    return (
      <p>
        <FontAwesomeIcon icon={"user-plus"} />{" "}
        {t("signup.help.directSignupOpenNow")}{" "}
        <b>{getFormattedTime(directSignupEndTime, timeNow)}</b>.
        {groupMemberInfo}
      </p>
    );
  }

  // Lottery sign-up
  if (lotterySignupNotStarted) {
    // Waiting for sign up to start
    return (
      <p>
        <FontAwesomeIcon icon={"dice-three"} />{" "}
        {t("signup.help.lotterySignupStartsLater")}
        <b>
          {getFormattedInterval(
            lotterySignupStartTime,
            lotterySignupEndTime,
            timeNow,
          )}
        </b>
        . {t("signup.help.directSignupStarts")}
        <b>
          {getFormattedInterval(
            directSignupStartTime,
            directSignupEndTime,
            timeNow,
          )}
        </b>
        .
      </p>
    );
  }

  if (lotterySignupInProgress) {
    // Lottery sign-up happening now
    return (
      <p>
        <FontAwesomeIcon icon={"dice-three"} />{" "}
        {t("signup.help.lotterySignupOpen")}
        <b>{getFormattedTime(lotterySignupEndTime, timeNow)}</b>.
        {t("signup.help.directSignupStarts")}
        <b>
          {getFormattedInterval(
            directSignupStartTime,
            directSignupEndTime,
            timeNow,
          )}
        </b>
        .
      </p>
    );
  }

  return (
    // Lottery sign-up ended, direct sign-up starting or started
    <p>
      <FontAwesomeIcon icon={"dice-three"} />{" "}
      {t("signup.help.lotterySignupEnded")}
      {t("signup.help.directSignupStarts")}
      <b>
        {getFormattedInterval(
          directSignupStartTime,
          directSignupEndTime,
          timeNow,
        )}
      </b>
      .
    </p>
  );
};
