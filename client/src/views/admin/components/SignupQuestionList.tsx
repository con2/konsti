import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { sortBy } from "lodash-es";
import { Game } from "shared/types/models/game";
import { SignupQuestion } from "shared/types/models/settings";
import { getWeekdayAndTime } from "client/utils/timeFormatter";

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
        (game) => game.gameId === privateSignupQuestion.gameId,
      );
      if (!matchingGame) {
        return [];
      }
      return { ...privateSignupQuestion, game: matchingGame };
    },
  );

  const sortedSignupQuestions = sortBy(signupQuestionsWithGames, [
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
            (game) => game.gameId === signupQuestion.gameId,
          );
          if (!foundGame) {
            return [];
          }

          return (
            <li key={`${signupQuestion.gameId}-${signupQuestion.questionFi}`}>
              <Link to={`/games/${signupQuestion.gameId}`}>
                {foundGame.title}
              </Link>
              <span>
                : {signupQuestion.questionFi} / {signupQuestion.questionEn}
              </span>{" "}
              {signupQuestion.selectOptions.length > 0 && (
                <span>
                  (
                  {signupQuestion.selectOptions
                    .map((option) => `${option.optionFi} / ${option.optionEn}`)
                    .join(", ")}
                  )
                </span>
              )}{" "}
              {signupQuestion.private && <BoldText>({t("private")})</BoldText>}{" "}
              - {t(`programType.${foundGame.programType}`)} -{" "}
              <span>{getWeekdayAndTime(foundGame.startTime)}</span>
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
