import React, { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { submitSignup } from "client/views/signup/signupThunks";
import { DragAndDropList } from "client/views/signup/components/DragAndDropList";
import { sleep } from "client/utils/sleep";
import { config } from "client/config";
import { Game } from "shared/typings/models/game";
import { SignupTimeButtons } from "./SignupTimeButtons";
import { SignupInfo } from "./SignupInfo";
import { SignupActionButtons } from "./SignupActionButtons";
import { filterAvailableGames } from "client/views/signup/utils/filterAvailableGames";
import { filterSelectedGames } from "client/views/signup/utils/filterSelectedGames";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitSelectedGames } from "client/views/signup/signupSlice";

export enum SignupError {
  GENERIC = "signupError.generic",
  SIGNUP_ENDED = "signupError.signupEnded",
  EMPTY = "",
}

export interface Props {
  games: readonly Game[];
  signupTimes: readonly string[];
  isGroupLeader: boolean;
}

export const SignupList = ({
  games,
  signupTimes,
  isGroupLeader,
}: Props): ReactElement => {
  const signupTime = useAppSelector((state) => state.signup.signupTime);
  const username = useAppSelector((state) => state.login.username);
  const groupCode = useAppSelector((state) => state.login.groupCode);
  const hiddenGames = useAppSelector((state) => state.admin.hiddenGames);
  const signedGames = useAppSelector((state) => state.myGames.signedGames);
  const selectedGames = useAppSelector((state) => state.signup.selectedGames);
  const unsavedChanges = useAppSelector((state) => state.signup.unsavedChanges);

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [signupSubmitted, setSignupSubmitted] = useState<boolean>(false);

  const [signupError, setSignupError] = useState<SignupError>(
    SignupError.EMPTY
  );

  useEffect(() => {
    if (!unsavedChanges) {
      dispatch(submitSelectedGames(signedGames));
    }
  }, [unsavedChanges, signedGames]);

  const onSubmitClick = async (): Promise<void> => {
    setSubmitting(true);

    const signupData = {
      username,
      selectedGames,
      signupTime,
    };

    const errorCode = await dispatch(submitSignup(signupData));

    if (errorCode) {
      switch (errorCode) {
        case 41:
          showMessage("signupEnded");
          return;
        default:
          showMessage("signupError");
          return;
      }
    }

    showMessage("signupSubmitted");
    setSubmitting(false);
  };

  const onCancelClick = async (): Promise<void> => {
    setSubmitting(true);

    const gamesWithDifferentTime = selectedGames.filter((selectedGame) => {
      if (selectedGame.time !== signupTime) {
        return selectedGame;
      }
    });

    const signupData = {
      username,
      selectedGames: gamesWithDifferentTime,
      signupTime: signupTime,
    };

    const errorCode = await dispatch(submitSignup(signupData));

    if (errorCode) {
      switch (errorCode) {
        case 41:
          showMessage("signupEnded");
          return;
        default:
          showMessage("signupError");
          return;
      }
    }

    showMessage("signupSubmitted");
    setSubmitting(false);
  };

  const updateSelectedGames = (newSelectedGames: readonly Game[]): void => {
    const newSignups = newSelectedGames.map((newSelectedGame) => {
      return {
        gameDetails: { ...newSelectedGame },
        priority: newSelectedGames.indexOf(newSelectedGame) + 1,
        time: signupTime,
        message: "",
      };
    });

    const existingGames = selectedGames.filter(
      (selectedGame) => selectedGame.gameDetails.startTime !== signupTime
    );
    const combined = existingGames.concat(newSignups);
    dispatch(submitSelectedGames(combined));
  };

  const showMessage = async (message: string): Promise<void> => {
    if (message === "signupSubmitted") {
      setSignupSubmitted(true);
    } else if (message === "signupError") {
      setSignupError(SignupError.GENERIC);
    } else if (message === "signupEnded") {
      setSignupError(SignupError.SIGNUP_ENDED);
    }
    await sleep(config.MESSAGE_DELAY);
    setSignupSubmitted(false);
    setSignupError(SignupError.EMPTY);
  };

  return (
    <SignupListContainer>
      {signupTimes.length === 0 ? (
        <h2>{t("noOpenSignups")}</h2>
      ) : (
        <>
          <h2>{t("signupOpen")}</h2>
          <SignupTimeButtons
            signupTimes={signupTimes}
            signupTime={signupTime}
          />

          {signupTime && (
            <>
              <SignupInfo signupTime={signupTime} />

              <SignupActionButtons
                submitting={submitting}
                isGroupLeader={isGroupLeader}
                onSubmitClick={onSubmitClick}
                onCancelClick={onCancelClick}
                signupSubmitted={signupSubmitted}
                groupCode={groupCode}
                signedGames={signedGames}
                selectedGames={selectedGames}
                signupError={signupError}
              />

              <DragAndDropList
                availableGames={filterAvailableGames(
                  games,
                  hiddenGames,
                  selectedGames,
                  signupTime
                )}
                selectedGames={filterSelectedGames(selectedGames, signupTime)}
                updateSelectedGames={updateSelectedGames}
              />
            </>
          )}
        </>
      )}
    </SignupListContainer>
  );
};

const SignupListContainer = styled.div`
  margin: 0;
`;
