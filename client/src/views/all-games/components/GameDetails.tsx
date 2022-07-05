import React, { ReactElement, useState, useEffect, ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import {
  submitAddSignupQuestion,
  submitDeleteSignupQuestion,
  submitUpdateHidden,
} from "client/views/admin/adminThunks";
import { FeedbackForm } from "client/views/all-games/components/FeedbackForm";
import { GameInfo } from "client/views/all-games/components/GameInfo";
import { Loading } from "client/components/Loading";
import { Game } from "shared/typings/models/game";
import { updateFavorite, UpdateFavoriteOpts } from "client/utils/favorite";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import { setActiveProgramType } from "client/views/admin/adminSlice";
import { Dropdown } from "client/components/Dropdown";

export const GameDetails = (): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const navigate = useNavigate();
  const { gameId } = useParams();

  const username = useAppSelector((state) => state.login.username);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const games = useAppSelector((state) => state.allGames.games);
  const userGroup = useAppSelector((state) => state.login.userGroup);
  const favoritedGames = useAppSelector(
    (state) => state.myGames.favoritedGames
  );
  const hiddenGames = useAppSelector((state) => state.admin.hiddenGames);
  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions
  );
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType
  );

  const [hidden, setHidden] = useState<boolean>(false);
  const [favorited, setFavorited] = useState<boolean>(false);
  const [hasSignupQuestion, setHasSignupQuestion] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [createPrivateSignupQuestion, setCreatePrivateSignupQuestion] =
    useState<boolean>(false);

  const [signupQuestionInput, setSignupQuestionInput] = useState<string>("");
  const [signupQuestionInputVisible, setSignupQuestionInputVisible] =
    useState<boolean>(false);

  const foundGame = games.find((game) => game.gameId === gameId);

  if (foundGame && foundGame.programType !== activeProgramType) {
    dispatch(setActiveProgramType(foundGame.programType));
  }

  useEffect(() => {
    setLoading(true);

    const checkGameState = (): void => {
      if (!foundGame || !foundGame.gameId) return;

      // Check if in favorites
      favoritedGames.find((favoritedGame) => {
        if (favoritedGame.gameId === foundGame.gameId) {
          setFavorited(true);
        }
      });

      // Check if hidden
      hiddenGames.find((hiddenGame) => {
        if (hiddenGame.gameId === foundGame.gameId) {
          setHidden(true);
        }
      });

      // Check if signup question exists
      signupQuestions.find((signupQuestion) => {
        if (signupQuestion.gameId === foundGame.gameId) {
          setHasSignupQuestion(true);
        }
      });
    };

    checkGameState();
    setLoading(false);
  }, [foundGame, favoritedGames, hiddenGames, signupQuestions]);

  // Favorite / remove favorite clicked
  const updateFavoriteHandler = async (action: string): Promise<void> => {
    if (!foundGame || !foundGame.gameId) return;

    setSubmitting(true);
    const updateFavoriteOpts: UpdateFavoriteOpts = {
      game: foundGame,
      action,
      username,
      favoritedGames,
      dispatch,
    };

    await updateFavorite(updateFavoriteOpts);

    setSubmitting(false);

    if (action === "add") {
      setFavorited(true);
    } else if (action === "del") {
      setFavorited(false);
    }
  };

  // Hide / show clicked
  const updateHidden = async (action: string): Promise<void> => {
    if (!foundGame || !foundGame.gameId) return;

    setSubmitting(true);
    const gameIndex = findGame(foundGame.gameId, hiddenGames);
    const allHiddenGames = hiddenGames.slice();

    if (action === "add") {
      if (gameIndex === -1) {
        allHiddenGames.push(foundGame);
      }
    } else if (action === "del") {
      if (gameIndex > -1) {
        allHiddenGames.splice(gameIndex, 1);
      }
    }

    try {
      await dispatch(submitUpdateHidden(allHiddenGames));
    } catch (error) {
      throw new Error(`submitUpdateHidden error: ${error}`);
    }

    setSubmitting(false);

    if (action === "add") {
      setHidden(true);
    } else if (action === "del") {
      setHidden(false);
    }
  };

  const handleSignupQuestionChange = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSignupQuestionInput(event.target.value);
  };

  const onClickAddSignupQuestion = (): void => {
    if (!foundGame) return;
    dispatch(
      submitAddSignupQuestion({
        gameId: foundGame.gameId,
        message: signupQuestionInput,
        private: createPrivateSignupQuestion,
      })
    );
    setSignupQuestionInputVisible(false);
    setSignupQuestionInput("");
  };

  const onClickDeleteSignupQuestion = (): void => {
    if (!foundGame) return;
    dispatch(submitDeleteSignupQuestion(foundGame.gameId));
    setHasSignupQuestion(false);
  };

  return (
    <div>
      <div>
        <Button
          onClick={() => {
            // Navigate to front page if no previous page exists
            window.history.state?.idx > 0 ? navigate(-1) : navigate("/");
          }}
          buttonStyle={ButtonStyle.NORMAL}
        >
          {t("button.back")}
        </Button>

        {favorited && loggedIn && userGroup === "user" && foundGame && (
          <Button
            buttonStyle={submitting ? ButtonStyle.DISABLED : ButtonStyle.NORMAL}
            onClick={async () => await updateFavoriteHandler("del")}
          >
            {t("button.removeFavorite")}
          </Button>
        )}

        {!favorited && loggedIn && userGroup === "user" && foundGame && (
          <Button
            buttonStyle={submitting ? ButtonStyle.DISABLED : ButtonStyle.NORMAL}
            onClick={async () => await updateFavoriteHandler("add")}
          >
            {t("button.favorite")}
          </Button>
        )}

        {hidden && loggedIn && userGroup === "admin" && foundGame && (
          <Button
            buttonStyle={submitting ? ButtonStyle.DISABLED : ButtonStyle.NORMAL}
            onClick={async () => await updateHidden("del")}
          >
            {t("button.show")}
          </Button>
        )}

        {!hidden && loggedIn && userGroup === "admin" && foundGame && (
          <Button
            buttonStyle={submitting ? ButtonStyle.DISABLED : ButtonStyle.NORMAL}
            onClick={async () => await updateHidden("add")}
          >
            {t("button.hide")}
          </Button>
        )}

        {!hasSignupQuestion &&
          !signupQuestionInputVisible &&
          loggedIn &&
          userGroup === "admin" &&
          foundGame && (
            <Button
              buttonStyle={
                submitting ? ButtonStyle.DISABLED : ButtonStyle.NORMAL
              }
              onClick={() => setSignupQuestionInputVisible(true)}
            >
              {t("button.addSignupQuestion")}
            </Button>
          )}

        {!hasSignupQuestion &&
          signupQuestionInputVisible &&
          loggedIn &&
          userGroup === "admin" &&
          foundGame && (
            <Button
              buttonStyle={
                submitting ? ButtonStyle.DISABLED : ButtonStyle.NORMAL
              }
              onClick={() => setSignupQuestionInputVisible(false)}
            >
              {t("button.cancel")}
            </Button>
          )}

        {hasSignupQuestion && loggedIn && userGroup === "admin" && foundGame && (
          <Button
            buttonStyle={submitting ? ButtonStyle.DISABLED : ButtonStyle.NORMAL}
            onClick={onClickDeleteSignupQuestion}
          >
            {t("button.removeSignupQuestion")}
          </Button>
        )}
      </div>

      {loading && <Loading />}

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

          <PrivateQuestionText>
            {t("createPrivateQuestion")}
          </PrivateQuestionText>

          <Dropdown
            items={[
              { value: "no", title: t("no") },
              { value: "yes", title: t("yes") },
            ]}
            selectedValue={createPrivateSignupQuestion ? "yes" : "no"}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setCreatePrivateSignupQuestion(event.target.value === "yes")
            }
          />

          <p>
            <Button
              onClick={onClickAddSignupQuestion}
              buttonStyle={ButtonStyle.NORMAL}
            >
              {t("button.save")}
            </Button>
          </p>
        </>
      )}

      {!loading && !foundGame && (
        <div>
          {t("invalidGameId")} {gameId}.
        </div>
      )}

      {!loading && foundGame && (
        <>
          <GameInfo game={foundGame} />
          {loggedIn && <FeedbackForm game={foundGame} />}
        </>
      )}
    </div>
  );
};

// Find selected game index
const findGame = (gameId: string, array: readonly Game[]): number => {
  for (let i = 0; i < array.length; i += 1) {
    if (array[i].gameId === gameId) {
      return i;
    }
  }
  return -1;
};

const FormInput = styled.input`
  border: 1px solid ${(props) => props.theme.borderInactive};
  color: ${(props) => props.theme.buttonText};
  height: 34px;
  padding: 0 0 0 10px;
  width: 100%;
  margin-bottom: 8px;
`;

const PrivateQuestionText = styled.span`
  margin-right: 8px;
`;
