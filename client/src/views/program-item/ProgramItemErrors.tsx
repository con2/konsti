import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { getAttendeeType } from "client/utils/getAttendeeType";
import { ProgramType } from "shared/types/models/programItem";
import { ErrorMessage } from "client/components/ErrorMessage";

interface Props {
  isValidMinAttendanceValue: boolean;
  isValidMaxAttendanceValue: boolean;
  minAttendanceBiggerThanMax: boolean;
  signupTypeMissing: boolean;
  programType: ProgramType;
}

export const ProgramItemErrors = ({
  isValidMinAttendanceValue,
  isValidMaxAttendanceValue,
  minAttendanceBiggerThanMax,
  signupTypeMissing,
  programType,
}: Props): ReactElement => {
  const { t } = useTranslation();

  return (
    <ErrorsList data-testid="program-item-errors">
      {!isValidMinAttendanceValue && (
        <ErrorMessage
          message={t("signup.minAttendanceMissing", {
            ATTENDEE_TYPE: t(
              `attendeeTypePlural.${getAttendeeType(programType)}`,
            ),
          })}
        />
      )}

      {!isValidMaxAttendanceValue && (
        <ErrorMessage
          message={t("signup.maxAttendanceMissing", {
            ATTENDEE_TYPE: t(
              `attendeeTypePlural.${getAttendeeType(programType)}`,
            ),
          })}
        />
      )}

      {minAttendanceBiggerThanMax && (
        <ErrorMessage
          message={t("signup.minAttendanceBiggerThanMax", {
            ATTENDEE_TYPE: t(
              `attendeeTypePlural.${getAttendeeType(programType)}`,
            ),
          })}
        />
      )}

      {signupTypeMissing && (
        <ErrorMessage message={t("signup.signupType.missing")} />
      )}
    </ErrorsList>
  );
};

const ErrorsList = styled.div`
  display: flex;
  flex-direction: column;
`;
