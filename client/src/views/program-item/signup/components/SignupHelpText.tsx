import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { ProgramItem } from "shared/types/models/programItem";
import { isDirectSignupAlwaysOpen } from "shared/utils/isDirectSignupAlwaysOpen";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import {
  getDirectSignupEndTime,
  getDirectSignupEnded,
  getDirectSignupInProgress,
  getDirectSignupStartTime,
  getLotterySignupEndTime,
  getLotterySignupInProgress,
  getLotterySignupNotStarted,
  getLotterySignupStartTime,
  hasLotteryAlreadyRun,
  willNotBeLotteried,
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

  const timeNow = useTimeNow();

  // Said out loud either way: an attendee seeing a future program item offer only direct
  // sign-up has no other way to know why. The two causes read differently - one is about the
  // starting time changing, the other about the program item having sign-ups already
  const noLotteryAhead = willNotBeLotteried(programItem, timeNow);

  const noLotteryInfo = noLotteryAhead ? (
    <span>
      {" "}
      {t(
        hasLotteryAlreadyRun(programItem)
          ? "signup.help.lotteryAlreadyRunInfo"
          : "signup.help.notInLotteryInfo",
      )}
    </span>
  ) : null;

  // Cannot use programItem.signupStrategy here since it's relative to time
  const isLotterySignup =
    isLotterySignupProgramItem(programItem) &&
    !tooEarlyForLotterySignup(programItem) &&
    !noLotteryAhead;

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
    // A revolving door item has no sign-up instructions to look up, so say how
    // to take part here instead of pointing at the program details
    const messageKey = programItem.revolvingDoor
      ? ("signup.revolvingDoorNoKonstiSignup" as const)
      : (`signup.signupType.${programItem.signupType}` as const);
    return (
      <p>
        {t(messageKey, {
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
          {noLotteryInfo}
          {groupMemberInfo}
        </p>
      );
    }

    return (
      <p>
        <FontAwesomeIcon icon={"user-plus"} />{" "}
        {t("signup.help.directSignupOpenNow")}{" "}
        <b>{getFormattedTime(directSignupEndTime, timeNow)}</b>.{noLotteryInfo}
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
