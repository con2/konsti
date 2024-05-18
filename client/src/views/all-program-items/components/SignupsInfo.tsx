import { ReactElement, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { getAttendeeType } from "client/utils/getAttendeeType";
import { ProgramItem, ProgramType } from "shared/types/models/programItem";
import { isRevolvingDoorWorkshop } from "client/utils/isRevolvingDoorWorkshop";
import { ExpandButton } from "client/components/ExpandButton";

interface Props {
  isEnterGameMode: boolean;
  isNormalSignup: boolean;
  programItem: ProgramItem;
  attendeeCount: number;
}

export const SignupsInfo = ({
  isEnterGameMode,
  isNormalSignup,
  programItem,
  attendeeCount,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const isValidMaxAttendanceValue =
    !isRevolvingDoorWorkshop(programItem) && programItem.maxAttendance > 0;

  const attendeesText = t(
    `attendeeTypePluralNominative.${getAttendeeType(programItem.programType)}`,
  );

  const showMoreText = t("signup.showAttendees", {
    ATTENDEE_TYPE: attendeesText,
  });

  const showLessText = t("signup.hideAttendees", {
    ATTENDEE_TYPE: attendeesText,
  });

  const ariaId = `participants-for-${programItem.programItemId}`;

  return (
    <>
      {isEnterGameMode && isNormalSignup && isValidMaxAttendanceValue && (
        <SignupsInfoContainer>
          <div>
            {t("signup.signupCount", {
              ATTENDEE_COUNT: attendeeCount,
              MAX_ATTENDANCE: programItem.maxAttendance,
            })}
            <ExpandButton
              isExpanded={isExpanded}
              showMoreText={showMoreText}
              showLessText={showLessText}
              showMoreAriaLabel={showMoreText}
              showLessAriaLabel={showLessText}
              ariaControls={ariaId}
              onClick={() => setIsExpanded(!isExpanded)}
            />
          </div>

          {isExpanded &&
            (attendeeCount === 0 ? (
              <NoAttendeesText>
                {t("signup.noAttendees", {
                  ATTENDEE_TYPE: t(
                    `attendeeTypePlural.${getAttendeeType(programItem.programType)}`,
                  ),
                })}
              </NoAttendeesText>
            ) : (
              <ul>{"TODO list attendees"}</ul>
            ))}
        </SignupsInfoContainer>
      )}

      {!isValidMaxAttendanceValue &&
        programItem.programType !== ProgramType.WORKSHOP && (
          <ErrorText>
            {t("signup.maxAttendanceMissing", {
              ATTENDEE_TYPE: t(
                `attendeeTypePlural.${getAttendeeType(programItem.programType)}`,
              ),
            })}
          </ErrorText>
        )}
    </>
  );
};

const SignupsInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const NoAttendeesText = styled.p`
  color: ${(props) => props.theme.textSecondary};
  margin: 12px 0 0 12px;
`;

const ErrorText = styled.span`
  color: ${(props) => props.theme.textError};
`;
