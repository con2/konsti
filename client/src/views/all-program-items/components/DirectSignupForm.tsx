import { ReactElement, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ProgramItem } from "shared/types/models/programItem";
import { DirectSignupProgramItemForm } from "./DirectSignupProgramItemForm";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import {
  getSignupOpensDate,
  isAlreadyDirectySigned,
} from "./allProgramItemsUtils";
import { Button, ButtonStyle } from "client/components/Button";
import { CancelSignupForm } from "./CancelSignupForm";
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

interface Props {
  programItem: ProgramItem;
  startTime: string;
  programItemIsFull: boolean;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const DirectSignupForm = ({
  programItem,
  startTime,
  programItemIsFull,
  loading,
  setLoading,
}: Props): ReactElement | null => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { signupOpen } = config.shared();

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
    (g) => g.programItemDetails.startTime === startTime,
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
        <div>
          {timeNow.isBefore(directSignupStartTime) && (
            <>
              <span>{t("signup.signupOpens")}</span>{" "}
              <BoldText>
                {getSignupOpensDate(directSignupStartTime, timeNow)}
              </BoldText>
            </>
          )}
          {timeNow.isSameOrAfter(directSignupStartTime) && (
            <span>{t("signup.directSignupOpenNow")}</span>
          )}
        </div>
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
            <DirectSignupContainer>
              {t("signup.alreadySignedToProgramItem", {
                PROGRAM_TYPE: t(
                  `programTypeIllative.${directSignupForTimeslot.programItemDetails.programType}`,
                ),
              })}{" "}
              <DirectSignupProgramItemTitle>
                {directSignupForTimeslot.programItemDetails.title}
              </DirectSignupProgramItemTitle>
              . {t("signup.cannotSignupMoreThanOneProgramItem")}
            </DirectSignupContainer>
          )}

          {!directSignupForTimeslot && (
            <>
              {timeNow.isBefore(directSignupStartTime) && (
                <p>
                  {t("signup.signupOpens")}{" "}
                  <BoldText>
                    {getSignupOpensDate(directSignupStartTime, timeNow)}
                  </BoldText>
                </p>
              )}

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
                <DirectSignupProgramItemForm
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
          <DirectSignupContainer>
            {t("signup.currentSignup", {
              PROGRAM_TYPE: t(`programTypeIllative.${programItem.programType}`),
            })}
          </DirectSignupContainer>

          {signupOpen && (
            <>
              {!cancelSignupFormOpen && (
                <ButtonContainer>
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

const DirectSignupContainer = styled.div`
  border: 1px solid ${(props) => props.theme.infoBorder};
  padding: 8px 6px;
  border-radius: 5px;
  border-left: 5px solid ${(props) => props.theme.infoBorder};
  background-color: ${(props) => props.theme.infoBackground};
`;

const DirectSignupProgramItemTitle = styled.span`
  font-weight: 600;
`;

const BoldText = styled.span`
  font-weight: 600;
`;

const ButtonContainer = styled.div`
  margin: 8px 0;
  display: flex;
  justify-content: center;
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
