import { ReactElement, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ProgramItem } from "shared/types/models/programItem";
import { DirectSignupForm } from "client/views/program-item/signup/components/DirectSignupForm";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { isAlreadyDirectySigned } from "client/views/program-item/programItemUtils";
import { Button, ButtonStyle } from "client/components/Button";
import { CancelSignupForm } from "client/views/program-item/signup/components/CancelSignupForm";
import {
  DeleteDirectSignupErrorMessage,
  submitDeleteDirectSignup,
} from "client/views/my-program-items/myProgramItemsThunks";
import { loadProgramItems } from "client/utils/loadData";
import { ErrorMessage } from "client/components/ErrorMessage";
import { selectDirectSignups } from "client/views/my-program-items/myProgramItemsSlice";
import { getTimeNow } from "client/utils/getTimeNow";
import { getDirectSignupStartTime } from "shared/utils/signupTimes";
import { config } from "shared/config";
import { InfoText } from "client/components/InfoText";
import { AdmissionTicketLink } from "client/views/program-item/signup/components/AdmissionTicketLink";

interface Props {
  programItem: ProgramItem;
  startTime: string;
  programItemIsFull: boolean;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const DirectSignupProgramItem = ({
  programItem,
  startTime,
  programItemIsFull,
  loading,
  setLoading,
}: Props): ReactElement | null => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { signupOpen } = config.event();

  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const username = useAppSelector((state) => state.login.username);
  const directSignups = useAppSelector(selectDirectSignups);
  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions,
  );

  const [signupFormOpen, setSignupFormOpen] = useState(false);
  const [cancelSignupFormOpen, setCancelSignupFormOpen] = useState(false);
  const [serverError, setServerError] =
    useState<DeleteDirectSignupErrorMessage | null>(null);

  const directSignupForTimeslot = directSignups.find(
    (p) => p.programItem.startTime === startTime,
  );

  const alreadySignedToProgramItem = isAlreadyDirectySigned(
    programItem,
    directSignups,
  );

  const removeSignup = async (): Promise<void> => {
    setLoading(true);
    const errorMessage = await dispatch(
      submitDeleteDirectSignup({
        username,
        startTime: programItem.startTime,
        directSignupProgramItemId: programItem.programItemId,
      }),
    );

    if (errorMessage) {
      setServerError(errorMessage);
    } else {
      // TODO: Don't reload program items, backend response should return all required data
      await loadProgramItems();
      setCancelSignupFormOpen(false);
    }
    setLoading(false);
  };

  const directSignupStartTime = getDirectSignupStartTime(programItem);
  const timeNow = getTimeNow();

  if (!loggedIn) {
    return (
      <NotLoggedSignupInfo>
        <CreateAccountLink>
          <Link to={`/login`}>{t("signup.loginToSignup")}</Link>
        </CreateAccountLink>
      </NotLoggedSignupInfo>
    );
  }

  return (
    <>
      {signupOpen && programItemIsFull && (
        <BoldText>
          {t("signup.programItemFull", {
            PROGRAM_TYPE: t(`programTypeSingular.${programItem.programType}`),
          })}
        </BoldText>
      )}

      {signupOpen && !alreadySignedToProgramItem && !programItemIsFull && (
        <>
          {directSignupForTimeslot && (
            <InfoText>
              {t("signup.alreadySignedToProgramItem", {
                PROGRAM_TYPE: t(
                  `programTypeIllative.${directSignupForTimeslot.programItem.programType}`,
                ),
              })}{" "}
              <DirectSignupProgramItemTitle>
                {directSignupForTimeslot.programItem.title}
              </DirectSignupProgramItemTitle>
              . {t("signup.cannotSignupMoreThanOneProgramItem")}
            </InfoText>
          )}

          {!directSignupForTimeslot && (
            <>
              {!signupFormOpen &&
                timeNow.isSameOrAfter(directSignupStartTime) && (
                  <ButtonContainer>
                    <StyledButton
                      onClick={() => setSignupFormOpen(!signupFormOpen)}
                      buttonStyle={ButtonStyle.PRIMARY}
                      disabled={loading}
                    >
                      {t("signup.directSignup")}
                    </StyledButton>
                  </ButtonContainer>
                )}

              {signupFormOpen && (
                <DirectSignupForm
                  programItem={programItem}
                  signupQuestion={signupQuestions.find(
                    ({ programItemId }) =>
                      programItemId === programItem.programItemId,
                  )}
                  onDirectSignupProgramItem={() => setSignupFormOpen(false)}
                  onCancelSignup={() => setSignupFormOpen(false)}
                  loading={loading}
                  setLoading={setLoading}
                />
              )}
            </>
          )}
        </>
      )}

      {alreadySignedToProgramItem && (
        <>
          <InfoText>
            {t("signup.currentSignup", {
              PROGRAM_TYPE: t(`programTypeIllative.${programItem.programType}`),
            })}
          </InfoText>

          {signupOpen && (
            <>
              {!cancelSignupFormOpen && (
                <ButtonContainer>
                  <AdmissionTicketLink
                    programItemId={programItem.programItemId}
                  />
                  <StyledButton
                    onClick={() => setCancelSignupFormOpen(true)}
                    buttonStyle={ButtonStyle.SECONDARY}
                  >
                    {t("button.cancelSignup")}
                  </StyledButton>
                </ButtonContainer>
              )}

              {cancelSignupFormOpen && (
                <CancelSignupForm
                  onCancelForm={() => {
                    setCancelSignupFormOpen(false);
                  }}
                  onConfirmForm={async () => await removeSignup()}
                  loading={loading}
                />
              )}
            </>
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

const DirectSignupProgramItemTitle = styled.span`
  font-weight: 600;
`;

const BoldText = styled.span`
  font-weight: 600;
`;

const ButtonContainer = styled.div`
  margin: 8px 0;
  display: flex;
  gap: 8px;
  justify-content: center;

  @media (max-width: ${(props) => props.theme.breakpointDesktop}) {
    flex-direction: column;
  }
`;

const StyledButton = styled(Button)`
  min-width: 400px;
  @media (max-width: ${(props) => props.theme.breakpointDesktop}) {
    width: 100%;
    min-width: 0;
  }
`;

const NotLoggedSignupInfo = styled.div`
  margin: 16px 0;
`;

const CreateAccountLink = styled.div`
  margin: 8px 0 0 0;
`;
