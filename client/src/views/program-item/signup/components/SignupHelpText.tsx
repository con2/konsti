import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProgramItem } from "shared/types/models/programItem";
import { getTimeNow } from "client/utils/getTimeNow";
import { isRevolvingDoorWorkshop } from "client/utils/isRevolvingDoorWorkshop";
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

interface Props {
  programItem: ProgramItem;
  isSignupAlwaysOpen: boolean;
  usesKonstiSignup: boolean;
  isInGroup: boolean;
}

export const SignupHelpText = ({
  programItem,
  isSignupAlwaysOpen,
  usesKonstiSignup,
  isInGroup,
}: Props): ReactElement | null => {
  const { t } = useTranslation();

  // Cannot use programItem.signupStrategy here since it's relative to time
  const isLotterySignup =
    isLotterySignupProgramItem(programItem) &&
    !tooEarlyForLotterySignup(programItem.startTime);

  const timeNow = getTimeNow();

  const lotterySignupStartTime = getLotterySignupStartTime(
    programItem.startTime,
  );
  const lotterySignupEndTime = getLotterySignupEndTime(programItem.startTime);
  const lotterySignupNotStarted = getLotterySignupNotStarted(
    programItem.startTime,
    timeNow,
  );
  const lotterySignupInProgress = getLotterySignupInProgress(
    programItem.startTime,
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

  if (isRevolvingDoorWorkshop(programItem)) {
    return (
      <p>
        {t("signup.help.doesNotRequireSignup", {
          PROGRAM_TYPE: t(`programTypeIllative.${programItem.programType}`),
        })}
      </p>
    );
  }

  if (!usesKonstiSignup) {
    return (
      <p>
        {t("signup.help.noKonstiSignup", {
          PROGRAM_TYPE: t(`programTypeIllative.${programItem.programType}`),
        })}
      </p>
    );
  }

  if (isSignupAlwaysOpen) {
    return (
      <p>
        {t("signup.help.signupAlwaysOpen", {
          PROGRAM_TYPE: t(`programTypeIllative.${programItem.programType}`),
        })}
        {isInGroup && (
          <span>{t("signup.help.signupAlwaysOpenGroupMemberInfo")}</span>
        )}
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
        </p>
      );
    }

    return (
      <p>
        <FontAwesomeIcon icon={"user-plus"} />{" "}
        {t("signup.help.directSignupOpenNow")}{" "}
        <b>{getFormattedTime(directSignupEndTime, timeNow)}</b>.
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
