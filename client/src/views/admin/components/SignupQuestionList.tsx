import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styled from "styled-components";
import _ from "lodash";
import { Game } from "shared/typings/models/game";
import { SignupQuestion } from "shared/typings/models/settings";
import { timeFormatter } from "client/utils/timeFormatter";

interface Props {
  signupQuestions: readonly SignupQuestion[];
  games: readonly Game[];
}

export const SignupQuestionList = ({
  signupQuestions,
  games,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const signupQuestionsWithGames = signupQuestions.flatMap(
    (privateSignupQuestion) => {
      const matchingGame = games.find(
        (game) => game.gameId === privateSignupQuestion.gameId
      );
      if (!matchingGame) return [];
      return { ...privateSignupQuestion, game: matchingGame };
    }
  );

  const sortedSignupQuestions = _.sortBy(signupQuestionsWithGames, [
    "game.startTime",
    (signupQuestion) => signupQuestion.game.title.toLocaleLowerCase(),
  ]);

  return (
    <div>
      <h3>{t("signupQuestions")}</h3>

      <ul>
        {signupQuestions.length === 0 && <span>{t("noSignupQuestions")}</span>}

        {sortedSignupQuestions.flatMap((signupQuestion) => {
          const foundGame = games.find(
            (game) => game.gameId === signupQuestion.gameId
          );
          if (!foundGame) return [];

          return (
            <li key={`${signupQuestion.gameId}-${signupQuestion.message}`}>
              <Link to={`/games/${signupQuestion.gameId}`}>
                {foundGame.title}
              </Link>
              : {signupQuestion.message}{" "}
              {signupQuestion.private && <BoldText>({t("private")})</BoldText>}{" "}
              - {t(`programType.${foundGame.programType}`)} -{" "}
              {timeFormatter.getWeekdayAndTime({
                time: foundGame.startTime,
                capitalize: false,
              })}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const BoldText = styled.span`
  font-weight: 600;
`;
