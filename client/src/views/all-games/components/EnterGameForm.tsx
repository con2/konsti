import { ReactElement, FormEvent, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Game, ProgramType } from "shared/typings/models/game";
import {
  PostEnteredGameErrorMessage,
  submitPostEnteredGame,
} from "client/views/my-games/myGamesThunks";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import {
  SignupQuestion,
  SignupQuestionType,
} from "shared/typings/models/settings";
import { loadGames } from "client/utils/loadData";
import { ErrorMessage } from "client/components/ErrorMessage";
import { getIsGroupCreator, getIsInGroup } from "client/views/group/groupUtils";
import {
  PostCloseGroupErrorMessage,
  PostLeaveGroupErrorMessage,
  submitCloseGroup,
  submitLeaveGroup,
} from "client/views/group/groupThunks";
import { sharedConfig } from "shared/config/sharedConfig";
import { TextArea } from "client/components/TextArea";
import { ButtonGroup } from "client/components/ButtonGroup";
import { Dropdown } from "client/components/Dropdown";

const { directSignupAlwaysOpenIds } = sharedConfig;

interface Props {
  game: Game;
  signupQuestion: SignupQuestion | undefined;
  onEnterGame: () => void;
  onCancelSignup: () => void;
}

export const EnterGameForm = ({
  game,
  onEnterGame,
  onCancelSignup,
  signupQuestion,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const username = useAppSelector((state) => state.login.username);
  const serial = useAppSelector((state) => state.login.serial);
  const groupCode = useAppSelector((state) => state.group.groupCode);

  const [userSignupMessage, setUserSignupMessage] = useState<string>("");
  const [selectedValue, setSelectedValue] = useState<string>(
    signupQuestion?.selectOptions[0] ?? ""
  );
  const [agreeEntryFee, setAgreeEntryFee] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<
    | PostEnteredGameErrorMessage
    | PostLeaveGroupErrorMessage
    | PostCloseGroupErrorMessage
    | null
  >(null);

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
      message: userSignupMessage || selectedValue,
    };

    // TODO: This logic should be on backend
    if (
      game.programType === ProgramType.TABLETOP_RPG &&
      !directSignupAlwaysOpenIds.includes(game.gameId)
    ) {
      if (isInGroup && !isGroupCreator) {
        const leaveGroupError = await dispatch(submitLeaveGroup());

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
      {game.programType === ProgramType.TABLETOP_RPG &&
        !directSignupAlwaysOpenIds.includes(game.gameId) && (
          <>
            {isInGroup && !isGroupCreator && (
              <Warning>{t("signup.inGroupWarning")}</Warning>
            )}
            {isInGroup && isGroupCreator && (
              <Warning>{t("signup.groupCreatorWarning")}</Warning>
            )}
          </>
        )}

      {signupQuestion && (
        <SignupQuestionContainer>
          {signupQuestion.type === SignupQuestionType.TEXT && (
            <>
              <span>
                {signupQuestion.question}{" "}
                {signupQuestion.private &&
                  `(${t("privateOnlyVisibleToOrganizers")})`}
              </span>
              <TextArea
                onChange={(event) => {
                  if (event.target.value.length > 140) {
                    return;
                  }
                  setUserSignupMessage(event.target.value);
                }}
                value={userSignupMessage}
              />
              <span>{userSignupMessage.length} / 140</span>
            </>
          )}

          {signupQuestion.type === SignupQuestionType.SELECT && (
            <>
              <span>
                {signupQuestion.question}{" "}
                {signupQuestion.private &&
                  `(${t("privateOnlyVisibleToOrganizers")})`}
              </span>
              <Dropdown
                onChange={(event) => setSelectedValue(event.target.value)}
                options={signupQuestion.selectOptions.map((option) => ({
                  value: option,
                  title: option,
                }))}
                selectedValue={selectedValue}
              />
            </>
          )}
        </SignupQuestionContainer>
      )}

      {!!game.entryFee && (
        <div>
          <input
            type="checkbox"
            checked={agreeEntryFee}
            onChange={() => {
              setAgreeEntryFee(!agreeEntryFee);
            }}
            aria-labelledby={"entry-fee-agree-checkbox-label"}
          />
          <label id="entry-fee-agree-checkbox-label">
            {t("signup.entryFeeInfo", {
              ENTRY_FEE: game.entryFee,
            })}{" "}
          </label>
        </div>
      )}

      <ButtonGroup>
        <Button
          onClick={handleSignup}
          buttonStyle={ButtonStyle.PRIMARY}
          disabled={!!game.entryFee && !agreeEntryFee}
        >
          {t("signup.confirm")}
        </Button>
        <Button onClick={handleCancel} buttonStyle={ButtonStyle.SECONDARY}>
          {t("signup.cancel")}
        </Button>
      </ButtonGroup>

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
