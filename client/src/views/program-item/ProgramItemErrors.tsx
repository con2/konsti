import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { getAttendeeType } from "client/utils/getAttendeeType";
import { ProgramType } from "shared/types/models/programItem";
import { ErrorMessage } from "client/components/ErrorMessage";

interface Props {
  isValidMinAttendanceValue: boolean;
  isValidMaxAttendanceValue: boolean;
  programType: ProgramType;
}

export const ProgramItemErrors = ({
  isValidMinAttendanceValue,
  isValidMaxAttendanceValue,
  programType,
}: Props): ReactElement => {
  const { t } = useTranslation();

  return (
    <ErrorsList>
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
    </ErrorsList>
  );
};

const ErrorsList = styled.div`
  display: flex;
  flex-direction: column;
`;
