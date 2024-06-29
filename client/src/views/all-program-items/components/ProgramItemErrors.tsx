import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { getAttendeeType } from "client/utils/getAttendeeType";
import { ProgramType } from "shared/types/models/programItem";

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
        <ErrorText>
          {t("signup.minAttendanceMissing", {
            ATTENDEE_TYPE: t(
              `attendeeTypePlural.${getAttendeeType(programType)}`,
            ),
          })}
        </ErrorText>
      )}

      {!isValidMaxAttendanceValue && (
        <ErrorText>
          {t("signup.maxAttendanceMissing", {
            ATTENDEE_TYPE: t(
              `attendeeTypePlural.${getAttendeeType(programType)}`,
            ),
          })}
        </ErrorText>
      )}
    </ErrorsList>
  );
};

const ErrorText = styled.span`
  color: ${(props) => props.theme.textError};
`;
const ErrorsList = styled.div`
  display: flex;
  flex-direction: column;
`;
