import React, { ChangeEvent, ReactElement, useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Game } from "shared/typings/models/game";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
// eslint-disable-next-line no-restricted-imports
import loaderImage from "../../../../assets/loading.gif";
import {
  submitAddSignupQuestion,
  submitDeleteSignupQuestion,
  submitUpdateHidden,
} from "client/views/admin/adminThunks";

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
      <Button
        buttonStyle={submitting ? ButtonStyle.DISABLED : ButtonStyle.NORMAL}
        onClick={async () => await updateHidden()}
      >
        {hidden ? t("button.show") : t("button.hide")}
      </Button>
      {hasSignupQuestion && (
        <Button
          buttonStyle={submitting ? ButtonStyle.DISABLED : ButtonStyle.NORMAL}
          onClick={deleteSignupQuestion}
        >
          {t("button.removeSignupQuestion")}
        </Button>
      )}
      {!hasSignupQuestion && !signupQuestionInputVisible && (
        <Button
          buttonStyle={submitting ? ButtonStyle.DISABLED : ButtonStyle.NORMAL}
          onClick={() =>
            setSignupQuestionInputVisible(!signupQuestionInputVisible)
          }
        >
          {t("button.addSignupQuestion")}
        </Button>
      )}
      {signupQuestionInputVisible && (
        <>
          <p>{t("gameDetails.addSignupTextField")}</p>
          <FormInput
            type={"text"}
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
          <p>
            <Button
              onClick={addSignupQuestion}
              buttonStyle={ButtonStyle.NORMAL}
            >
              {t("button.save")}
            </Button>
            <Button
              buttonStyle={
                submitting ? ButtonStyle.DISABLED : ButtonStyle.NORMAL
              }
              onClick={() => setSignupQuestionInputVisible(false)}
            >
              {t("button.cancel")}
            </Button>
          </p>
        </>
      )}
    </Container>
  );
};

const Container = styled.div`
  border: 1px solid ${(props) => props.theme.borderActive};
  border-radius: 4px;
  margin: 8px 0;
  padding: 0 8px;
  h4 {
    margin-bottom: 4px;
    margin-top: 16px;
  }
`;

const HeaderContainer = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
`;

const FormInput = styled.input`
  border: 1px solid ${(props) => props.theme.borderInactive};
  color: ${(props) => props.theme.buttonText};
  height: 34px;
  padding: 0 0 0 10px;
  width: 100%;
  margin-bottom: 8px;
`;
