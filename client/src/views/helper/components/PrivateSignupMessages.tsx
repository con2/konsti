import React, { ReactElement } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "client/utils/hooks";

export const PrivateSignupMessages = (): ReactElement => {
  const { t } = useTranslation();

  const games = useAppSelector((state) => state.allGames.games);
  const signupMessages = useAppSelector((state) => state.admin.signupMessages);

  const privateSignupMessages = signupMessages.filter(
    (signupMessage) => signupMessage.private
  );

  return (
    <div>
      <h3>{t("signupMessages")}</h3>
      <p>{t("helperView.privateSignupMessagesInfo")}</p>

      {privateSignupMessages.map((signupMessage) => {
        const matchingGame = games.find(
          (game) => game.gameId === signupMessage.gameId
        );
        if (!matchingGame) return null;

        return (
          <p key={signupMessage.gameId}>
            <Link to={`/games/${matchingGame.gameId}`}>
              {matchingGame.title}
            </Link>{" "}
            {signupMessage.message}
          </p>
        );
      })}
    </div>
  );
};
