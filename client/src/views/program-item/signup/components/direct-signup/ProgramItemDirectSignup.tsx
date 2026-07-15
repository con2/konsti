import { ReactElement, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { ProgramItem } from "shared/types/models/programItem";
import { DirectSignupForm } from "client/views/program-item/signup/components/direct-signup/DirectSignupForm";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { isAlreadyDirectySigned } from "client/views/program-item/programItemUtils";
import { ButtonStyle } from "client/components/Button";
import {
  DeleteDirectSignupErrorMessage,
  submitDeleteDirectSignup,
} from "client/views/my-program-items/myProgramItemsThunks";
import { selectDirectSignups } from "client/views/my-program-items/myProgramItemsSlice";
import { getTimeNow } from "client/utils/getTimeNow";
import { getDirectSignupStartTime } from "shared/utils/signupTimes";
import { AdmissionTicketLink } from "client/views/program-item/signup/components/AdmissionTicketLink";
import { startLoading, stopLoading } from "client/state/loading/loadingSlice";
import { SignupQuestionAnswer } from "client/components/SignUpQuestionAnswer";
import { LoginToSignupLink } from "client/views/program-item/signup/components/LoginToSignupLink";
import { ProgramItemButton } from "client/views/program-item/components/ProgramItemButton";
import { ProgramItemButtonGroup } from "client/views/program-item/components/ProgramItemButtonGroup";
import { ProgramItemCancelSignupForm } from "client/views/program-item/components/ProgramItemCancelSignupForm";
import { ErrorMessage } from "client/components/ErrorMessage";
import { InfoText } from "client/components/InfoText";
import { ProgramItemStatusMessage } from "client/views/program-item/components/ProgramItemStatusMessage";

interface Props {
  programItem: ProgramItem;
  programItemIsFull: boolean;
}

export const ProgramItemDirectSignup = ({
  programItem,
  programItemIsFull,
}: Props): ReactElement | null => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const directSignups = useAppSelector(selectDirectSignups);
  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions,
  );
  const loading = useAppSelector((state) => state.loading);

  const [signupFormOpen, setSignupFormOpen] = useState(false);
  const [cancelSignupFormOpen, setCancelSignupFormOpen] = useState(false);
  const [serverError, setServerError] =
    useState<DeleteDirectSignupErrorMessage | null>(null);

  const directSignupForTimeslot = directSignups.find(
    (signup) => signup.programItem.startTime === programItem.startTime,
  );

  const signupQuestion = signupQuestions.find(
    (question) => question.programItemId === programItem.programItemId,
  );

  const alreadySignedToProgramItem = isAlreadyDirectySigned(
    programItem,
    directSignups,
  );

  const removeSignup = async (): Promise<void> => {
    dispatch(startLoading());
    const errorMessage = await dispatch(
      submitDeleteDirectSignup({
        directSignupProgramItemId: programItem.programItemId,
      }),
    );

    if (errorMessage) {
      setServerError(errorMessage);
    } else {
      setCancelSignupFormOpen(false);
    }
    dispatch(stopLoading());
  };

  const directSignupStartTime = getDirectSignupStartTime(programItem);
  const timeNow = getTimeNow();

  const programItemFullMessage = (
    <ProgramItemStatusMessage data-testid="program-item-full">
      {t("signup.programItemFull", {
        PROGRAM_TYPE: t(`programTypeSingular.${programItem.programType}`),
      })}
    </ProgramItemStatusMessage>
  );

  if (!loggedIn) {
    if (programItemIsFull) {
      return programItemFullMessage;
    }
    return <LoginToSignupLink />;
  }

  const canSignUp =
    !alreadySignedToProgramItem &&
    !programItemIsFull &&
    !directSignupForTimeslot;
  const signupOpen = timeNow.isSameOrAfter(directSignupStartTime);

  // The only state with nothing to render: the user could sign up, but
  // signup has not opened yet. Render nothing rather than an empty element
  if (canSignUp && !signupOpen && !signupFormOpen) {
    return null;
  }

  return (
    <>
      {programItemIsFull && programItemFullMessage}

      {!alreadySignedToProgramItem &&
        !programItemIsFull &&
        directSignupForTimeslot && (
          <InfoText>
            {t("signup.alreadySignedToProgramItem", {
              PROGRAM_TYPE: t(
                `programTypeIllative.${directSignupForTimeslot.programItem.programType}`,
              ),
            })}{" "}
            <DirectSignupTitle>
              {directSignupForTimeslot.programItem.title}
            </DirectSignupTitle>
            . {t("signup.cannotSignupMoreThanOneProgramItem")}
          </InfoText>
        )}

      {canSignUp && signupOpen && !signupFormOpen && (
        <ProgramItemButtonGroup>
          <ProgramItemButton
            onClick={() => setSignupFormOpen(true)}
            buttonStyle={ButtonStyle.PRIMARY}
            disabled={loading}
          >
            {t("signup.directSignup")}
          </ProgramItemButton>
        </ProgramItemButtonGroup>
      )}

      {canSignUp && signupFormOpen && (
        <DirectSignupForm
          programItem={programItem}
          signupQuestion={signupQuestion}
          onDirectSignupProgramItem={() => setSignupFormOpen(false)}
          onCancelSignup={() => setSignupFormOpen(false)}
        />
      )}

      {alreadySignedToProgramItem && (
        <>
          <InfoText>
            {t("signup.currentSignup", {
              PROGRAM_TYPE: t(`programTypeIllative.${programItem.programType}`),
            })}
          </InfoText>

          {!!signupQuestion && (
            <SignupQuestionAnswer
              signupQuestion={signupQuestion}
              signupMessage={directSignupForTimeslot?.message ?? ""}
            />
          )}

          {!cancelSignupFormOpen && (
            <ProgramItemButtonGroup>
              <AdmissionTicketLink programItemId={programItem.programItemId} />
              <ProgramItemButton
                onClick={() => setCancelSignupFormOpen(true)}
                buttonStyle={ButtonStyle.SECONDARY}
              >
                {t("button.cancelSignup")}
              </ProgramItemButton>
            </ProgramItemButtonGroup>
          )}

          {cancelSignupFormOpen && (
            <ProgramItemCancelSignupForm
              onCancelForm={() => {
                setCancelSignupFormOpen(false);
              }}
              onConfirmForm={async () => await removeSignup()}
              loading={loading}
            />
          )}
        </>
      )}

      {serverError && (
        <ErrorMessage
          message={t(serverError)}
          closeError={() => setServerError(null)}
        />
      )}
    </>
  );
};

const DirectSignupTitle = styled.span`
  font-weight: 600;
`;
