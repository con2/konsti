import { ChangeEvent, ReactElement, useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import loaderImage from "assets/loading.gif";
import { Game } from "shared/typings/models/game";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import {
  submitAddSignupQuestion,
  submitDeleteSignupQuestion,
  submitUpdateHidden,
} from "client/views/admin/adminThunks";
import { ButtonGroup } from "client/components/ButtonGroup";
import { ControlledInput } from "client/components/ControlledInput";

interface Props {
  game: Game;
}

export const AdminActionCard = ({ game }: Props): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const hiddenGames = useAppSelector((state) => state.admin.hiddenGames);
  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions
  );

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [hidden, setHidden] = useState<boolean>(false);
  const [hasSignupQuestion, setHasSignupQuestion] = useState<boolean>(false);
  const [isPrivateSignupQuestion, setIsPrivateSignupQuestion] =
    useState<boolean>(false);
  const [signupQuestionInput, setSignupQuestionInput] = useState<string>("");
  const [signupQuestionInputVisible, setSignupQuestionInputVisible] =
    useState<boolean>(false);

  const handleSignupQuestionChange = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSignupQuestionInput(event.target.value);
  };

  useEffect(() => {
    // Check if hidden
    hiddenGames.find((hiddenGame) => {
      if (hiddenGame.gameId === game.gameId) {
        setHidden(true);
      }
    });

    // Check if signup question exists
    signupQuestions.find((signupQuestion) => {
      if (signupQuestion.gameId === game.gameId) {
        setHasSignupQuestion(true);
      }
    });
  }, [game.gameId, hiddenGames, signupQuestions]);

  const updateHidden = async (): Promise<void> => {
    setSubmitting(true);

    const newHidden = !hidden;

    const gameIndex = hiddenGames.findIndex((g) => g.gameId === game.gameId);
    const allHiddenGames = hiddenGames.slice();

    if (newHidden && gameIndex === -1) {
      allHiddenGames.push(game);
    } else if (!newHidden && gameIndex > -1) {
      allHiddenGames.splice(gameIndex, 1);
    }

    try {
      await dispatch(submitUpdateHidden(allHiddenGames));
    } catch (error) {
      // eslint-disable-next-line no-restricted-syntax -- TODO: Remove throw
      throw new Error(`submitUpdateHidden error: ${error}`);
    } finally {
      setSubmitting(false);
    }

    setHidden(newHidden);
  };

  const deleteSignupQuestion = async (): Promise<void> => {
    setSubmitting(true);

    try {
      await dispatch(submitDeleteSignupQuestion(game.gameId));
    } catch (error) {
      // eslint-disable-next-line no-restricted-syntax -- TODO: Remove throw
      throw new Error(`deleteSignupQuestion error: ${error}`);
    } finally {
      setSubmitting(false);
    }
    setHasSignupQuestion(false);
  };

  const addSignupQuestion = async (): Promise<void> => {
    setSubmitting(true);

    try {
      await dispatch(
        submitAddSignupQuestion({
          gameId: game.gameId,
          message: signupQuestionInput,
          private: isPrivateSignupQuestion,
        })
      );
    } catch (error) {
      // eslint-disable-next-line no-restricted-syntax -- TODO: Remove throw
      throw new Error(`addSignupQuestion error: ${error}`);
    } finally {
      setSubmitting(false);
    }
    setHasSignupQuestion(true);

    // Clear inputs
    setSignupQuestionInputVisible(false);
    setSignupQuestionInput("");
    setIsPrivateSignupQuestion(false);
  };

  return (
    <Container>
      <HeaderContainer>
        <h4>{t("gameInfo.adminActions")}</h4>
        {submitting && (
          <img alt={t("loading")} src={loaderImage} height="24" width="24" />
        )}
      </HeaderContainer>
      <ButtonGroup>
        <Button
          key="hideButton"
          disabled={submitting}
          buttonStyle={ButtonStyle.PRIMARY}
          onClick={async () => await updateHidden()}
        >
          {hidden ? t("button.showProgramItem") : t("button.hideProgramItem")}
        </Button>
        {hasSignupQuestion && (
          <Button
            key="signUpButton"
            disabled={submitting}
            buttonStyle={ButtonStyle.PRIMARY}
            onClick={deleteSignupQuestion}
          >
            {t("button.removeSignupQuestion")}
          </Button>
        )}
        {!hasSignupQuestion && !signupQuestionInputVisible && (
          <Button
            key="addSignUpQuestionButton"
            disabled={submitting}
            buttonStyle={ButtonStyle.PRIMARY}
            onClick={() =>
              setSignupQuestionInputVisible(!signupQuestionInputVisible)
            }
          >
            {t("button.addSignupQuestion")}
          </Button>
        )}
      </ButtonGroup>
      {signupQuestionInputVisible && (
        <>
          <p>{t("gameDetails.addSignupTextField")}</p>
          <ControlledInput
            key="new-password"
            placeholder={t("gameDetails.addSignupTextField")}
            value={signupQuestionInput}
            onChange={handleSignupQuestionChange}
          />
          <input
            type="checkbox"
            checked={isPrivateSignupQuestion}
            onChange={() => {
              setIsPrivateSignupQuestion(!isPrivateSignupQuestion);
            }}
            aria-labelledby={"private-question-checkbox-label"}
          />
          <label id="private-question-checkbox-label">
            {t("privateQuestion")}
          </label>
          <ButtonGroup>
            <Button
              onClick={addSignupQuestion}
              buttonStyle={ButtonStyle.PRIMARY}
            >
              {t("button.save")}
            </Button>
            <Button
              disabled={submitting}
              buttonStyle={ButtonStyle.SECONDARY}
              onClick={() => setSignupQuestionInputVisible(false)}
            >
              {t("button.cancel")}
            </Button>
          </ButtonGroup>
        </>
      )}
    </Container>
  );
};

const Container = styled.div`
  border: 1px solid ${(props) => props.theme.borderActive};
  border-radius: 4px;
  margin: 8px 0;
  padding: 16px 8px 8px 8px;
  h4 {
    margin-bottom: 4px;
    margin-top: 4px;
  }
`;

const HeaderContainer = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
`;
