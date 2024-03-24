import { ReactElement, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Game } from "shared/types/models/game";
import { EnterGameForm } from "./EnterGameForm";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { getSignupOpensDate, isAlreadyEntered } from "./allGamesUtils";
import { Button, ButtonStyle } from "client/components/Button";
import { CancelSignupForm } from "./CancelSignupForm";
import {
  DeleteEnteredGameErrorMessage,
  submitDeleteEnteredGame,
} from "client/views/my-games/myGamesThunks";
import { loadGames } from "client/utils/loadData";
import { ErrorMessage } from "client/components/ErrorMessage";
import { selectEnteredGames } from "client/views/my-games/myGamesSlice";
import { getTimeNow } from "client/utils/getTimeNow";
import { getDirectSignupStartTime } from "shared/utils/signupTimes";
import { config } from "shared/config";

interface Props {
  game: Game;
  startTime: string;
  gameIsFull: boolean;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const DirectSignupForm = ({
  game,
  startTime,
  gameIsFull,
  loading,
  setLoading,
}: Props): ReactElement | null => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { signupOpen } = config.shared();

  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const username = useAppSelector((state) => state.login.username);
  const enteredGames = useAppSelector(selectEnteredGames);
  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions,
  );

  const [signupFormOpen, setSignupFormOpen] = useState(false);
  const [cancelSignupFormOpen, setCancelSignupFormOpen] = useState(false);
  const [serverError, setServerError] =
    useState<DeleteEnteredGameErrorMessage | null>(null);

  const enteredGameForTimeslot = enteredGames.find(
    (g) => g.gameDetails.startTime === startTime,
  );

  const alreadyEnteredToGame = isAlreadyEntered(game, enteredGames);

  const removeSignup = async (): Promise<void> => {
    setLoading(true);
    const errorMessage = await dispatch(
      submitDeleteEnteredGame({
        username,
        startTime: game.startTime,
        enteredGameId: game.gameId,
      }),
    );

    if (errorMessage) {
      setServerError(errorMessage);
    } else {
      await loadGames();
      setCancelSignupFormOpen(false);
    }
    setLoading(false);
  };

  const directSignupStartTime = getDirectSignupStartTime(game);
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
      {signupOpen && gameIsFull && (
        <BoldText>
          {t("signup.programItemFull", {
            PROGRAM_TYPE: t(`programTypeSingular.${game.programType}`),
          })}
        </BoldText>
      )}

      {signupOpen && !alreadyEnteredToGame && !gameIsFull && (
        <>
          {enteredGameForTimeslot && (
            <SignedGameContainer>
              {t("signup.alreadySignedToGame", {
                PROGRAM_TYPE: t(
                  `programTypeIllative.${enteredGameForTimeslot.gameDetails.programType}`,
                ),
              })}{" "}
              <SignedGameName>
                {enteredGameForTimeslot.gameDetails.title}
              </SignedGameName>
              . {t("signup.cannotSignupMoreThanOneGame")}
            </SignedGameContainer>
          )}

          {!enteredGameForTimeslot && (
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
                <EnterGameForm
                  game={game}
                  signupQuestion={signupQuestions.find(
                    ({ gameId }) => gameId === game.gameId,
                  )}
                  onEnterGame={() => setSignupFormOpen(false)}
                  onCancelSignup={() => setSignupFormOpen(false)}
                  loading={loading}
                  setLoading={setLoading}
                />
              )}
            </>
          )}
        </>
      )}

      {alreadyEnteredToGame && (
        <>
          <SignedGameContainer>
            {t("signup.currentSignup", {
              PROGRAM_TYPE: t(`programTypeIllative.${game.programType}`),
            })}
          </SignedGameContainer>

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

const SignedGameContainer = styled.div`
  border: 1px solid ${(props) => props.theme.infoBorder};
  padding: 8px 6px;
  border-radius: 5px;
  border-left: 5px solid ${(props) => props.theme.infoBorder};
  background-color: ${(props) => props.theme.infoBackground};
`;

const SignedGameName = styled.span`
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
