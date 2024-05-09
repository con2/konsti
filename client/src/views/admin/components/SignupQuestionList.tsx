import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { sortBy } from "lodash-es";
import { ProgramItem } from "shared/types/models/programItem";
import { SignupQuestion } from "shared/types/models/settings";
import { getWeekdayAndTime } from "client/utils/timeFormatter";

interface Props {
  signupQuestions: readonly SignupQuestion[];
  programItems: readonly ProgramItem[];
}

export const SignupQuestionList = ({
  signupQuestions,
  programItems,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const signupQuestionsWithGames = signupQuestions.flatMap(
    (privateSignupQuestion) => {
      const matchingGame = programItems.find(
        (game) => game.programItemId === privateSignupQuestion.programItemId,
      );
      if (!matchingGame) {
        return [];
      }
      return { ...privateSignupQuestion, programItem: matchingGame };
    },
  );

  const sortedSignupQuestions = sortBy(signupQuestionsWithGames, [
    "game.startTime",
    (signupQuestion) => signupQuestion.programItem.title.toLocaleLowerCase(),
  ]);

  return (
    <div>
      <h3>{t("signupQuestions")}</h3>

      <ul>
        {signupQuestions.length === 0 && <span>{t("noSignupQuestions")}</span>}

        {sortedSignupQuestions.flatMap((signupQuestion) => {
          const foundGame = programItems.find(
            (game) => game.programItemId === signupQuestion.programItemId,
          );
          if (!foundGame) {
            return [];
          }

          return (
            <li
              key={`${signupQuestion.programItemId}-${signupQuestion.questionFi}`}
            >
              <Link to={`/games/${signupQuestion.programItemId}`}>
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
