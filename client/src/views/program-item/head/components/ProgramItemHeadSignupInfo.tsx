import { ReactElement, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { sortBy } from "remeda";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getAttendeeType } from "client/utils/getAttendeeType";
import { ProgramItem, UserSignup } from "shared/types/models/programItem";
import { ExpandButton } from "client/components/ExpandButton";
import { SignupQuestion } from "shared/types/models/settings";
import { config } from "shared/config";
import { useAppSelector } from "client/utils/hooks";
import { UserGroup } from "shared/types/models/user";
import { AppRoute } from "client/app/AppRoutes";

interface Props {
  isLoggedIn: boolean;
  programItem: ProgramItem;
  signups: UserSignup[];
  isDirectSignupMode: boolean;
  publicSignupQuestion: SignupQuestion | undefined;
}

export const ProgramItemHeadSignupInfo = ({
  isLoggedIn,
  programItem,
  signups,
  isDirectSignupMode,
  publicSignupQuestion,
}: Props): ReactElement => {
  const { t, i18n } = useTranslation();
  const useGroup = useAppSelector((state) => state.login.userGroup);

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

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

  const hideParticipantList =
    !(useGroup === UserGroup.ADMIN || useGroup === UserGroup.HELP) &&
    config
      .event()
      .hideParticipantListProgramTypes.includes(programItem.programType);

  return (
    <SignupsInfoContainer>
      <div>
        {t("signup.signupCount", {
          ATTENDEE_COUNT: signups.length,
          MAX_ATTENDANCE: programItem.maxAttendance,
        })}

        {signups.length < programItem.minAttendance && isDirectSignupMode && (
          <AttendeesNeeded>
            {t("signup.attendeesNeeded", {
              COUNT: programItem.minAttendance - signups.length,
            })}
          </AttendeesNeeded>
        )}
      </div>

      {!hideParticipantList && (
        <ExpandButton
          isExpanded={isExpanded}
          showMoreText={showMoreText}
          showLessText={showLessText}
          showMoreAriaLabel={showMoreText}
          showLessAriaLabel={showLessText}
          ariaControls={ariaId}
          onClick={() => setIsExpanded(!isExpanded)}
        />
      )}

      {isExpanded && signups.length === 0 && (
        <NoAttendeesText>
          {t("signup.noAttendees", {
            ATTENDEE_TYPE: t(
              `attendeeTypePlural.${getAttendeeType(programItem.programType)}`,
            ),
          })}
        </NoAttendeesText>
      )}

      {isExpanded && signups.length > 0 && isLoggedIn && (
        <>
          {publicSignupQuestion && (
            <QuestionContainer>
              <FontAwesomeIcon
                aria-label={t("signup.signupQuestionAriaLabel")}
                icon={["far", "comment"]}
              />
              <span>
                {": "}
                {i18n.language === "fi"
                  ? publicSignupQuestion.questionFi
                  : publicSignupQuestion.questionEn}
              </span>
            </QuestionContainer>
          )}
          <AttendeeList data-testid="attendee-list">
            {sortBy(signups, (signup) => signup.username).map((signup) => (
              <li key={signup.username}>
                {signup.username}
                {publicSignupQuestion && (
                  <AnswerText>: {signup.signupMessage}</AnswerText>
                )}
              </li>
            ))}
          </AttendeeList>
        </>
      )}

      {isExpanded && signups.length > 0 && !isLoggedIn && (
        <AttendeeText>
          <Link to={AppRoute.LOGIN}>{t("signup.loginLink")}</Link>
          {t("signup.loginLinkEnding", {
            ATTENDEE_TYPE: t(
              `attendeeTypePluralNominative.${getAttendeeType(programItem.programType)}`,
            ),
          })}
        </AttendeeText>
      )}
    </SignupsInfoContainer>
  );
};

const SignupsInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const QuestionContainer = styled.div`
  color: ${(props) => props.theme.textSecondary};
`;

const AttendeeText = styled.p`
  margin: 4px 0 0 12px;
`;

const AnswerText = styled.span`
  color: ${(props) => props.theme.textSecondary};
`;

const NoAttendeesText = styled(AttendeeText)`
  color: ${(props) => props.theme.textSecondary};
`;

const AttendeeList = styled.ul`
  margin: 0 0 0 12px;

  li {
    list-style: none;
  }

  /* Add some space between rows to group attendees if there are many of them to show. */
  li:nth-child(10n) {
    padding-bottom: 12px;
  }

  li:last-child {
    padding-bottom: 0;
  }
`;

const AttendeesNeeded = styled.span`
  color: ${(props) => props.theme.textSecondary};
  padding-left: 8px;
`;
