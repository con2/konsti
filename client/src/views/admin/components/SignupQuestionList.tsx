import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { sortBy } from "remeda";
import styled from "styled-components";
import { ProgramItem } from "shared/types/models/programItem";
import { SignupQuestion } from "shared/types/models/settings";
import { AppRoute } from "client/app/routes";
import { useTimeFormatters } from "client/utils/useTimeFormatters";

interface Props {
  signupQuestions: readonly SignupQuestion[];
  programItems: readonly ProgramItem[];
}

export const SignupQuestionList = ({
  signupQuestions,
  programItems,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const { getWeekdayAndTime } = useTimeFormatters();

  const signupQuestionsWithProgramItems = signupQuestions.flatMap(
    (privateSignupQuestion) => {
      const matchingProgramItem = programItems.find(
        (programItem) =>
          programItem.programItemId === privateSignupQuestion.programItemId,
      );
      if (!matchingProgramItem) {
        return [];
      }
      return { ...privateSignupQuestion, programItem: matchingProgramItem };
    },
  );

  const sortedSignupQuestions = sortBy(
    signupQuestionsWithProgramItems,
    (signupQuestion) => signupQuestion.programItem.startTime,
    (signupQuestion) => signupQuestion.programItem.title.toLocaleLowerCase(),
  );

  return (
    <div>
      <h3>{t("signupQuestions")}</h3>

      <ul>
        {signupQuestions.length === 0 && <span>{t("noSignupQuestions")}</span>}

        {sortedSignupQuestions.flatMap((signupQuestion) => {
          const foundProgramItem = programItems.find(
            (programItem) =>
              programItem.programItemId === signupQuestion.programItemId,
          );
          if (!foundProgramItem) {
            return [];
          }

          return (
            <li
              key={`${signupQuestion.programItemId}-${signupQuestion.questionFi}`}
            >
              <Link
                to={`${AppRoute.PROGRAM_ITEM}/${signupQuestion.programItemId}`}
              >
                {foundProgramItem.title}
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
              - {t(`programType.${foundProgramItem.programType}`)} -{" "}
              <span>{getWeekdayAndTime(foundProgramItem.startTime)}</span>
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
