import React, { FC, ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import styled from "styled-components";
import { Game } from "shared/typings/models/game";
import { SignupForm } from "./SignupForm";
import { submitPostSignedGames } from "client/views/my-games/myGamesThunks";
import { SelectedGame } from "shared/typings/models/user";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { isAlreadySigned } from "./allGamesUtils";
import { Button, ButtonStyle } from "client/components/Button";
import { getIsGroupCreator } from "client/views/group/groupUtils";
import { ErrorMessage } from "client/components/ErrorMessage";
import { CancelSignupForm } from "client/views/all-games/components/CancelSignupForm";
import { timeFormatter } from "client/utils/timeFormatter";
import { getTime } from "client/utils/getTime";
import { sharedConfig } from "shared/config/sharedConfig";

const { PRE_SIGNUP_START } = sharedConfig;

interface Props {
  game: Game;
  startTime: string;
  signedGames: readonly SelectedGame[];
}

export const AlgorithmSignupForm: FC<Props> = ({
  game,
  startTime,
  signedGames,
}: Props): ReactElement | null => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const username = useAppSelector((state) => state.login.username);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const serial = useAppSelector((state) => state.login.serial);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const groupMembers = useAppSelector((state) => state.group.groupMembers);
  const isGroupCreator = getIsGroupCreator(groupCode, serial);

  const [signupFormOpen, setSignupFormOpen] = useState(false);
  const [cancelSignupFormOpen, setCancelSignupFormOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const removeSignedGame = async (gameToRemove: Game): Promise<void> => {
    const newSignupData = signedGames.filter(
      (g: SelectedGame) => g.gameDetails.gameId !== gameToRemove.gameId
    );

    const error = await dispatch(
      submitPostSignedGames({
        username,
        selectedGames: newSignupData,
        startTime: gameToRemove.startTime,
      })
    );

    if (error) {
      setErrorMessage(t(error));
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

  const signupStartTime = dayjs(startTime)
    .subtract(PRE_SIGNUP_START, "minutes")
    .format();
  const timeNow = getTime();
  const lotterySignupOpen = dayjs(signupStartTime).isBefore(timeNow);

  if (!loggedIn) {
    return null;
  }

  return (
    <>
      {!alreadySignedToGame && isGroupCreator && (
        <>
          {signedGamesForTimeslot.length >= 3 && (
            <p>{t("signup.cannotSignupMoreGames")}</p>
          )}

          {!lotterySignupOpen && (
            <p>
              {t("signup.lotterySignupOpens")}{" "}
              <BoldText>
                {timeFormatter.getWeekdayAndTime({
                  time: signupStartTime,
                })}
              </BoldText>
            </p>
          )}

          {lotterySignupOpen &&
            signedGamesForTimeslot.length < 3 &&
            !signupFormOpen && (
              <ButtonWithMargin
                onClick={() => {
                  if (groupMembers.length > game.maxAttendance) {
                    setErrorMessage(t("group.groupTooBigWarning"));
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

          {isGroupCreator && !cancelSignupFormOpen && (
            <ButtonWithMargin
              onClick={() => setCancelSignupFormOpen(true)}
              buttonStyle={ButtonStyle.SECONDARY}
            >
              {t("button.cancel")}
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

      <ErrorMessage
        message={errorMessage}
        closeError={() => setErrorMessage("")}
      />

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
