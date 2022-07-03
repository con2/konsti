import React, { FC, ReactElement, FormEvent, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Game } from "shared/typings/models/game";
import {
  PostEnteredGameErrorMessage,
  submitPostEnteredGame,
} from "client/views/my-games/myGamesThunks";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import { SignupQuestion } from "shared/typings/models/settings";
import { loadGames } from "client/utils/loadData";
import { ErrorMessage } from "client/components/ErrorMessage";
import { getIsGroupCreator, getIsInGroup } from "client/views/group/groupUtils";
import {
  PostCloseGroupErrorMessage,
  PostLeaveGroupErrorMessage,
  submitCloseGroup,
  submitLeaveGroup,
} from "client/views/group/groupThunks";

interface Props {
  game: Game;
  signupQuestion: SignupQuestion | undefined;
  onEnterGame: () => void;
  onCancelSignup: () => void;
}

export const EnterGameForm: FC<Props> = (props: Props): ReactElement => {
  const { game, onEnterGame, onCancelSignup, signupQuestion } = props;
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.login.username);
  const serial = useAppSelector((state) => state.login.serial);
  const [userSignupMessage, setUserSignupMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<
    | PostEnteredGameErrorMessage
    | PostLeaveGroupErrorMessage
    | PostCloseGroupErrorMessage
    | null
  >(null);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const isInGroup = getIsInGroup(groupCode);
  const isGroupCreator = getIsGroupCreator(groupCode, serial);

  const handleCancel = (): void => {
    onCancelSignup();
  };

  const handleSignup = async (event: FormEvent): Promise<void> => {
    event.preventDefault();

    const enterData = {
      username,
      enteredGameId: game.gameId,
      startTime: game.startTime,
      message: userSignupMessage,
    };

    if (isInGroup && !isGroupCreator) {
      const leaveGroupRequest = {
        username,
      };

      const leaveGroupError = await dispatch(
        submitLeaveGroup(leaveGroupRequest)
      );

      if (leaveGroupError) {
        setErrorMessage(leaveGroupError);
        return;
      }
    } else if (isInGroup && isGroupCreator) {
      const closeGroupRequest = {
        username,
        groupCode,
      };

      const closeGroupError = await dispatch(
        submitCloseGroup(closeGroupRequest)
      );

      if (closeGroupError) {
        setErrorMessage(closeGroupError);
        return;
      }
    }

    const error = await dispatch(submitPostEnteredGame(enterData));
    if (error) {
      setErrorMessage(error);
      return;
    }

    await loadGames();
    onEnterGame();
  };

  return (
    <SignupForm>
      {isInGroup && !isGroupCreator && (
        <Warning>{t("signup.inGroupWarning")}</Warning>
      )}
      {isInGroup && isGroupCreator && (
        <Warning>{t("signup.groupCreatorWarning")}</Warning>
      )}
      {signupQuestion && (
        <SignupQuestionContainer>
          <span>
            {signupQuestion.message}{" "}
            {signupQuestion.private &&
              `(${t("privateOnlyVisibleToOrganizers")})`}
          </span>
          <textarea
            onChange={(evt) => {
              if (evt.target.value.length > 140) {
                return;
              }

              setUserSignupMessage(evt.target.value);
            }}
            value={userSignupMessage}
          />
          <span>{userSignupMessage.length} / 140</span>
        </SignupQuestionContainer>
      )}
      <ButtonContainer>
        <SignupConfirmationButton
          onClick={handleSignup}
          buttonStyle={ButtonStyle.NORMAL}
        >
          {t("signup.confirm")}
        </SignupConfirmationButton>
        <SignupCancelButton
          onClick={handleCancel}
          buttonStyle={ButtonStyle.NORMAL}
        >
          {t("signup.cancel")}
        </SignupCancelButton>
      </ButtonContainer>
      {errorMessage && (
        <ErrorMessage
          message={t(errorMessage)}
          closeError={() => setErrorMessage(null)}
        />
      )}
    </SignupForm>
  );
};

const Warning = styled.span`
  background-color: ${(props) => props.theme.warningBackground};
  border: 1px solid ${(props) => props.theme.warningBorder};
  border-radius: 4px;
  padding: 6px;
`;

const SignupForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const SignupQuestionContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const SignupConfirmationButton = styled(Button)`
  width: 50%;
  background: ${(props) => props.theme.buttonConfirm};
  border: 1px solid ${(props) => props.theme.buttonBorderConfirm};
  color: ${(props) => props.theme.textMain};
`;

const SignupCancelButton = styled(Button)`
  width: 50%;
  border: 1px solid ${(props) => props.theme.borderInformative};
`;
