import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { ProgramItem, SignupType } from "shared/types/models/programItem";
import { getTimeNow } from "client/utils/getTimeNow";
import { isRevolvingDoorWorkshop } from "client/utils/isRevolvingDoorWorkshop";
import {
  getAlgorithmSignupEndTime,
  getAlgorithmSignupStartTime,
  getDirectSignupStartTime,
} from "shared/utils/signupTimes";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import {
  getFormattedTime,
  getFormattedInterval,
} from "client/views/all-program-items/components/allProgramItemsUtils";

interface Props {
  programItem: ProgramItem;
  isSignupAlwaysOpen: boolean;
  usesKonstiSignup: boolean;
  startTime: string;
}

export const SignupHelpText = ({
  programItem,
  isSignupAlwaysOpen,
  usesKonstiSignup,
  startTime,
}: Props): ReactElement => {
  const { t } = useTranslation();

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
      </p>
    );
  }

  if (programItem.signupStrategy === SignupStrategy.DIRECT) {
    if (!directSignupStarted) {
      return (
        <p>
          {t("signup.help.directSignupStartsLater")}{" "}
          <b>{getFormattedTime(directSignupStartTime, timeNow)}</b>.
        </p>
      );
    }
    return (
      <p>
        {t("signup.help.directSignupOpenNow")}{" "}
        <b>{getFormattedTime(programStartTime, timeNow)}</b>.
      </p>
    );
  }

  if (programItem.signupStrategy === SignupStrategy.ALGORITHM) {
    // Waiting for sign up to start
    if (algorithmSignupStartTime.isSameOrAfter(timeNow)) {
      return (
        <p>
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
        </p>
      );

      // Algorithm sign-up happening now
    } else if (
      algorithmSignupEndTime.isSameOrAfter(timeNow) &&
      !directSignupStarted
    ) {
      return (
        <p>
          {t("signup.help.algorithmSignupOpen")}
          <b>{getFormattedTime(algorithmSignupEndTime, timeNow)}</b>.{" "}
          {t("signup.help.directSignupStarts")}
          <b>
            {getFormattedInterval(
              directSignupStartTime,
              programStartTime,
              timeNow,
            )}
          </b>
        </p>
      );

      // Algorithm sign-up ended, direct sign-up starting or started
    }
    return (
      <p>
        {t("signup.help.algorithmSignupEnded")}" "
        {t("signup.help.directSignupStarts")}
        <b>
          {getFormattedInterval(
            directSignupStartTime,
            programStartTime,
            timeNow,
          )}
        </b>
      </p>
    );
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <></>;
};
