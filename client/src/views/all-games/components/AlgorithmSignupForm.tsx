import { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { Game } from "shared/typings/models/game";
import { SignupForm } from "./SignupForm";
import {
  PostSignedGamesErrorMessage,
  submitPostSignedGames,
} from "client/views/my-games/myGamesThunks";
import { SelectedGame } from "shared/typings/models/user";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { isAlreadySigned } from "./allGamesUtils";
import { Button, ButtonStyle } from "client/components/Button";
import { getIsGroupCreator } from "client/views/group/groupUtils";
import { ErrorMessage } from "client/components/ErrorMessage";
import { CancelSignupForm } from "client/views/all-games/components/CancelSignupForm";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { getTimeNow } from "client/utils/getTimeNow";
import { sharedConfig } from "shared/config/sharedConfig";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { getAlgorithmSignupStartTime } from "shared/utils/signupTimes";

interface Props {
  game: Game;
  startTime: string;
  signedGames: readonly SelectedGame[];
}

enum ClientError {
  GROUP_TOO_BIG = "group.groupTooBigWarning",
}

export const AlgorithmSignupForm = ({
  game,
  startTime,
  signedGames,
}: Props): ReactElement | null => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const serial = useAppSelector((state) => state.login.serial);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const groupMembers = useAppSelector((state) => state.group.groupMembers);
  const isGroupCreator = getIsGroupCreator(groupCode, serial);

  const [signupFormOpen, setSignupFormOpen] = useState(false);
  const [cancelSignupFormOpen, setCancelSignupFormOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    ClientError | PostSignedGamesErrorMessage | null
  >(null);

  const removeSignedGame = async (gameToRemove: Game): Promise<void> => {
    const newSignupData = signedGames.filter(
      (g: SelectedGame) => g.gameDetails.gameId !== gameToRemove.gameId
    );

    const error = await dispatch(
      submitPostSignedGames({
        selectedGames: newSignupData,
        startTime: gameToRemove.startTime,
      })
    );

    if (error) {
      setErrorMessage(error);
    } else {
      setCancelSignupFormOpen(false);
      setSignupFormOpen(false);
    }
  };

  const currentPriority = signedGames.find(
    (g) => g.gameDetails.gameId === game.gameId
  )?.priority;

  const signedGamesForTimeslot = signedGames.filter(
    (g) => g.gameDetails.startTime === startTime
  );

  const alreadySignedToGame = isAlreadySigned(game, signedGames);

  const algorithmSignupStartTime = getAlgorithmSignupStartTime(startTime);

  const timeNow = getTimeNow();
  const lotterySignupOpen =
    algorithmSignupStartTime.isBefore(timeNow) ||
    sharedConfig.manualSignupMode === SignupStrategy.ALGORITHM;

  if (!loggedIn) {
    return (
      <NotLoggedSignupInfo>
        <div>
          {!lotterySignupOpen && (
            <>
              <span>{t("signup.lotterySignupOpens")}</span>{" "}
              <BoldText>
                {getWeekdayAndTime(algorithmSignupStartTime.toISOString())}
              </BoldText>
            </>
          )}
          {lotterySignupOpen && <span>{t("signup.lotterySignupOpenNow")}</span>}
        </div>
        <CreateAccountLink>
          <Link to={`/login`}>{t("signup.loginToSignup")}</Link>
        </CreateAccountLink>
      </NotLoggedSignupInfo>
    );
  }

  return (
    <>
      {sharedConfig.signupOpen && !alreadySignedToGame && isGroupCreator && (
        <>
          {signedGamesForTimeslot.length >= 3 && (
            <p>{t("signup.cannotSignupMoreGames")}</p>
          )}

          {!lotterySignupOpen && (
            <p>
              {t("signup.lotterySignupOpens")}{" "}
              <BoldText>
                {getWeekdayAndTime(algorithmSignupStartTime.toISOString())}
              </BoldText>
            </p>
          )}

          {lotterySignupOpen &&
            signedGamesForTimeslot.length < 3 &&
            !signupFormOpen && (
              <ButtonWithMargin
                onClick={() => {
                  if (groupMembers.length > game.maxAttendance) {
                    setErrorMessage(ClientError.GROUP_TOO_BIG);
                  } else {
                    setSignupFormOpen(true);
                  }
                }}
                buttonStyle={ButtonStyle.PRIMARY}
              >
                {t("signup.lotterySignup")}
              </ButtonWithMargin>
            )}
        </>
      )}

      {alreadySignedToGame && (
        <>
          <SignedGameContainer>
            {t("signup.alreadyLotterySigned", {
              CURRENT_PRIORITY: currentPriority,
            })}
          </SignedGameContainer>

          {sharedConfig.signupOpen && (
            <>
              {isGroupCreator && !cancelSignupFormOpen && (
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
                  onConfirmForm={async () => await removeSignedGame(game)}
                />
              )}
            </>
          )}
        </>
      )}

      {errorMessage && (
        <ErrorMessage
          message={t(errorMessage)}
          closeError={() => setErrorMessage(null)}
        />
      )}

      {signupFormOpen && !alreadySignedToGame && (
        <SignupForm
          game={game}
          startTime={startTime}
          onCancel={() => setSignupFormOpen(false)}
        />
      )}
    </>
  );
};

const SignedGameContainer = styled.div`
  border: 1px solid ${(props) => props.theme.infoBorder};
  padding: 8px 6px;
  margin-bottom: 8px;
  border-radius: 5px;
  border-left: 5px solid ${(props) => props.theme.infoBorder};
  background-color: ${(props) => props.theme.infoBackground};
`;

const BoldText = styled.span`
  font-weight: 600;
`;

const ButtonWithMargin = styled(Button)`
  margin-bottom: 8px;
`;

const NotLoggedSignupInfo = styled.div`
  margin: 16px 0;
`;

const CreateAccountLink = styled.div`
  margin: 8px 0 0 0;
`;
