import { ReactElement, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Game } from "shared/typings/models/game";
import { EnterGameForm } from "./EnterGameForm";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { isAlreadyEntered } from "./allGamesUtils";
import { Button, ButtonStyle } from "client/components/Button";
import { CancelSignupForm } from "./CancelSignupForm";
import { timeFormatter } from "client/utils/timeFormatter";
import {
  DeleteEnteredGameErrorMessage,
  submitDeleteEnteredGame,
} from "client/views/my-games/myGamesThunks";
import { loadGames } from "client/utils/loadData";
import { ErrorMessage } from "client/components/ErrorMessage";
import { selectActiveEnteredGames } from "client/views/my-games/myGamesSlice";
import { getTime } from "client/utils/getTime";
import { getDirectSignupStartTime } from "shared/utils/getDirectSignupStartTime";
import { sharedConfig } from "shared/config/sharedConfig";

interface Props {
  game: Game;
  startTime: string;
  gameIsFull: boolean;
}

export const DirectSignupForm = ({
  game,
  startTime,
  gameIsFull,
}: Props): ReactElement | null => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { signupOpen } = sharedConfig;

  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const username = useAppSelector((state) => state.login.username);
  const activeEnteredGames = useAppSelector(selectActiveEnteredGames);
  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions
  );

  const [signupFormOpen, setSignupFormOpen] = useState(false);
  const [cancelSignupFormOpen, setCancelSignupFormOpen] = useState(false);
  const [serverError, setServerError] =
    useState<DeleteEnteredGameErrorMessage | null>(null);

  const enteredGamesForTimeslot = activeEnteredGames.filter(
    (g) => g.gameDetails.startTime === startTime
  );

  const alreadyEnteredToGame = isAlreadyEntered(game, activeEnteredGames);

  const removeSignup = async (): Promise<void> => {
    const errorMessage = await dispatch(
      submitDeleteEnteredGame({
        username,
        startTime: game.startTime,
        enteredGameId: game.gameId,
      })
    );

    if (errorMessage) {
      setServerError(errorMessage);
    } else {
      await loadGames();
      setCancelSignupFormOpen(false);
    }
  };

  const timeNow = getTime();
  const directSignupStartTime = getDirectSignupStartTime(game, timeNow);

  if (!loggedIn) {
    return (
      <NotLoggedSignupInfo>
        <div>
          {directSignupStartTime && (
            <>
              <span>{t("signup.signupOpens")}</span>{" "}
              <BoldText>
                {timeFormatter.getWeekdayAndTime({
                  time: directSignupStartTime,
                })}
              </BoldText>
            </>
          )}
          {!directSignupStartTime && (
            <span>{t("signup.directSignupOpenNow")}</span>
          )}
        </div>
        <CreateAccountLink>
          <Link to={`/registration`}>{t("signup.registerToSignup")}</Link>
        </CreateAccountLink>
      </NotLoggedSignupInfo>
    );
  }

  return (
    <>
      {signupOpen && gameIsFull && (
        <GameIsFull>
          {t("signup.programItemFull", {
            PROGRAM_TYPE: t(`programTypeSingular.${game.programType}`),
          })}
        </GameIsFull>
      )}

      {signupOpen && !alreadyEnteredToGame && !gameIsFull && (
        <>
          {enteredGamesForTimeslot.length === 1 && (
            <SignedGameContainer>
              {t("signup.alreadySignedToGame", {
                PROGRAM_TYPE: t(`programTypeIllative.${game.programType}`),
              })}{" "}
              <SignedGameName>
                {enteredGamesForTimeslot[0].gameDetails.title}
              </SignedGameName>
              .{" "}
              {t("signup.cannotSignupMoreThanOneGame", {
                PROGRAM_TYPE: t(
                  `programTypeIllativePlural.${game.programType}`
                ),
              })}
            </SignedGameContainer>
          )}

          {enteredGamesForTimeslot.length === 0 && (
            <>
              {directSignupStartTime && (
                <p>
                  {t("signup.signupOpens")}{" "}
                  <BoldText>
                    {timeFormatter.getWeekdayAndTime({
                      time: directSignupStartTime,
                    })}
                  </BoldText>
                </p>
              )}

              {!signupFormOpen && !directSignupStartTime && (
                <ButtonWithMargin
                  onClick={() => setSignupFormOpen(!signupFormOpen)}
                  buttonStyle={ButtonStyle.PRIMARY}
                >
                  {t("signup.directSignup")}
                </ButtonWithMargin>
              )}

              {signupFormOpen && (
                <EnterGameForm
                  game={game}
                  signupQuestion={signupQuestions.find(
                    ({ gameId }) => gameId === game.gameId
                  )}
                  onEnterGame={() => setSignupFormOpen(false)}
                  onCancelSignup={() => setSignupFormOpen(false)}
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
                <ButtonWithMargin
                  onClick={() => setCancelSignupFormOpen(true)}
                  buttonStyle={ButtonStyle.SECONDARY}
                >
                  {t("button.cancelSignup")}
                </ButtonWithMargin>
              )}

              {cancelSignupFormOpen && (
                <CancelSignupForm
                  onCancelForm={() => {
                    setCancelSignupFormOpen(false);
                  }}
                  onConfirmForm={async () => await removeSignup()}
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

const GameIsFull = styled.h4`
  color: ${(props) => props.theme.textError};
`;

const SignedGameName = styled.span`
  font-weight: 600;
`;

const BoldText = styled.span`
  font-weight: 600;
`;

const ButtonWithMargin = styled(Button)`
  margin: 8px 0;
`;

const NotLoggedSignupInfo = styled.div`
  margin: 16px 0;
`;

const CreateAccountLink = styled.div`
  margin: 8px 0 0 0;
`;
