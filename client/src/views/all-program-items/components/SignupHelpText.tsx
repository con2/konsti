import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProgramItem, SignupType } from "shared/types/models/programItem";
import { getTimeNow } from "client/utils/getTimeNow";
import { isRevolvingDoorWorkshop } from "client/utils/isRevolvingDoorWorkshop";
import {
  getAlgorithmSignupEndTime,
  getAlgorithmSignupStartTime,
  getDirectSignupStartTime,
} from "shared/utils/signupTimes";
import {
  getFormattedTime,
  getFormattedInterval,
} from "client/views/all-program-items/components/allProgramItemsUtils";
import { config } from "shared/config";
import { tooEearlyForAlgorithmSignup } from "shared/utils/tooEearlyForAlgorithmSignup";

interface Props {
  programItem: ProgramItem;
  isSignupAlwaysOpen: boolean;
  usesKonstiSignup: boolean;
  startTime: string;
  isInGroup: boolean;
}

export const SignupHelpText = ({
  programItem,
  isSignupAlwaysOpen,
  usesKonstiSignup,
  startTime,
  isInGroup,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const isAlgorithmSignup =
    config
      .shared()
      .twoPhaseSignupProgramTypes.includes(programItem.programType) &&
    !tooEearlyForAlgorithmSignup(startTime);

  const timeNow = getTimeNow();
  const programStartTime = dayjs(programItem.startTime);
  const directSignupStartTime = getDirectSignupStartTime(programItem);
  const directSignupStarted = timeNow.isSameOrAfter(directSignupStartTime);
  const algorithmSignupStartTime = getAlgorithmSignupStartTime(startTime);
  const algorithmSignupEndTime = getAlgorithmSignupEndTime(startTime);

  if (
    programItem.signupType === SignupType.NONE ||
    timeNow.isSameOrAfter(programStartTime)
  ) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <></>;
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

  if (!isAlgorithmSignup) {
    if (!directSignupStarted) {
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
        <b>{getFormattedTime(programStartTime, timeNow)}</b>.
      </p>
    );
  }

  // Algorithm sign-up
  if (algorithmSignupStartTime.isSameOrAfter(timeNow)) {
    // Waiting for sign up to start
    return (
      <p>
        <FontAwesomeIcon icon={"dice-three"} />{" "}
        {t("signup.help.algorithmSignupStartsLater")}
        <b>
          {getFormattedInterval(
            algorithmSignupStartTime,
            algorithmSignupEndTime,
            timeNow,
          )}
        </b>
        . {t("signup.help.directSignupStarts")}
        <b>
          {getFormattedInterval(
            directSignupStartTime,
            programStartTime,
            timeNow,
          )}
        </b>
        .
      </p>
    );
  } else if (
    algorithmSignupEndTime.isSameOrAfter(timeNow) &&
    !directSignupStarted
  ) {
    // Algorithm sign-up happening now
    return (
      <p>
        <FontAwesomeIcon icon={"dice-three"} />{" "}
        {t("signup.help.algorithmSignupOpen")}
        <b>{getFormattedTime(algorithmSignupEndTime, timeNow)}</b>.
        {t("signup.help.directSignupStarts")}
        <b>
          {getFormattedInterval(
            directSignupStartTime,
            programStartTime,
            timeNow,
          )}
        </b>
        .
      </p>
    );
  }
  return (
    // Algorithm sign-up ended, direct sign-up starting or started
    <p>
      <FontAwesomeIcon icon={"dice-three"} />{" "}
      {t("signup.help.algorithmSignupEnded")}
      {t("signup.help.directSignupStarts")}
      <b>
        {getFormattedInterval(directSignupStartTime, programStartTime, timeNow)}
      </b>
      .
    </p>
  );
};
