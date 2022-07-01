import React, { ReactElement } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "client/utils/hooks";

export const PrivateSignupMessages = (): ReactElement => {
  const { t } = useTranslation();

  const games = useAppSelector((state) => state.allGames.games);
  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions
  );

  const privateSignupQuestions = signupQuestions.filter(
    (signupQuestion) => signupQuestion.private
  );

  return (
    <div>
      <h3>{t("signupQuestions")}</h3>
      <p>{t("helperView.privateSignupMessagesInfo")}</p>

      {privateSignupQuestions.map((signupQuestion) => {
        const matchingGame = games.find(
          (game) => game.gameId === signupQuestion.gameId
        );
        if (!matchingGame) return null;

        return (
          <p key={signupQuestion.gameId}>
            <Link to={`/games/${matchingGame.gameId}`}>
              {matchingGame.title}
            </Link>{" "}
            {signupQuestion.message}
          </p>
        );
      })}
    </div>
  );
};
