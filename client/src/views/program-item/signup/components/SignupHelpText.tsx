import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { ProgramItem } from "shared/types/models/programItem";
import { isDirectSignupAlwaysOpen } from "shared/utils/isDirectSignupAlwaysOpen";
import {
  hasLotteryAlreadyRun,
  isLotterySignupProgramItem,
} from "shared/utils/isLotterySignupProgramItem";
import {
  getDirectSignupEndTime,
  getDirectSignupEnded,
  getDirectSignupInProgress,
  getDirectSignupStartTime,
  getLotterySignupEndTime,
  getLotterySignupInProgress,
  getLotterySignupNotStarted,
  getLotterySignupStartTime,
} from "shared/utils/signupTimes";
import { tooEarlyForLotterySignup } from "shared/utils/tooEarlyForLotterySignup";
import { useAppSelector } from "client/utils/hooks";
import { useTimeFormatters } from "client/utils/useTimeFormatters";
import { useTimeNow } from "client/utils/useTimeNow";
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
  const { getFormattedInterval, getFormattedTime } = useTimeFormatters();

  const groupCode = useAppSelector((state) => state.group.groupCode);
  const isInGroup = getIsInGroup(groupCode);

  // Group members can sign up to always open program items without leaving the group
  const groupMemberInfo =
    isDirectSignupAlwaysOpen(programItem) && isInGroup ? (
      <span> {t("signup.help.signupAlwaysOpenGroupMemberInfo")}</span>
    ) : null;

  // Its starting time changed after its lottery, so it is not in another one and its spots
  // are first come, first served. Said out loud: an attendee seeing a future program item
  // offer only direct sign-up has no other way to know why
  const lotteryAlreadyRunInfo = hasLotteryAlreadyRun(programItem) ? (
    <span> {t("signup.help.lotteryAlreadyRunInfo")}</span>
  ) : null;

  // Cannot use programItem.signupStrategy here since it's relative to time
  const isLotterySignup =
    isLotterySignupProgramItem(programItem) &&
    !tooEarlyForLotterySignup(programItem) &&
    !hasLotteryAlreadyRun(programItem);

  const timeNow = useTimeNow();

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
          {lotteryAlreadyRunInfo}
          {groupMemberInfo}
        </p>
      );
    }

    return (
      <p>
        <FontAwesomeIcon icon={"user-plus"} />{" "}
        {t("signup.help.directSignupOpenNow")}{" "}
        <b>{getFormattedTime(directSignupEndTime, timeNow)}</b>.
        {lotteryAlreadyRunInfo}
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
        {t("signup.help.lotterySignupStartsLater")}{" "}
        <b>
          {getFormattedInterval(
            lotterySignupStartTime,
            lotterySignupEndTime,
            timeNow,
          )}
        </b>
        . {t("signup.help.directSignupStarts")}{" "}
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
        {t("signup.help.lotterySignupOpen")}{" "}
        <b>{getFormattedTime(lotterySignupEndTime, timeNow)}</b>.{" "}
        {t("signup.help.directSignupStarts")}{" "}
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
      {t("signup.help.lotterySignupEnded")}{" "}
      {t("signup.help.directSignupStarts")}{" "}
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
