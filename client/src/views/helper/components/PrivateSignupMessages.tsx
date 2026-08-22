import { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { capitalize, groupBy, sortBy } from "remeda";
import styled from "styled-components";
import { ProgramItem } from "shared/types/models/programItem";
import { AppRoute } from "client/app/routes";
import { ControlledInput } from "client/components/ControlledInput";
import { useAppSelector } from "client/utils/hooks";
import { useTimeFormatters } from "client/utils/useTimeFormatters";
import { selectProgramTypeForTexts } from "client/views/admin/adminSlice";
import { MULTIPLE_WHITESPACES_REGEX } from "client/views/all-program-items/AllProgramItemsView";

export const PrivateSignupMessages = (): ReactElement => {
  const { t } = useTranslation();
  const { getWeekdayAndTime } = useTimeFormatters();

  const [searchTerm, setSearchTerm] = useState<string>("");

  const programItems = useAppSelector(
    (state) => state.allProgramItems.programItems,
  );
  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions,
  );
  const signupMessages = useAppSelector((state) => state.admin.signupMessages);
  const programTypeForTexts = useAppSelector(selectProgramTypeForTexts);

  const privateSignupMessages = signupMessages.filter(
    (signupMessage) => signupMessage.private,
  );

  // Hoisted out of the filter: lowercasing is locale-aware and would otherwise
  // run once per program item per message
  const cleanedSearchTerm = searchTerm.toLocaleLowerCase();

  const filteredProgramItems: readonly ProgramItem[] =
    searchTerm.length === 0
      ? programItems
      : programItems.filter(
          (programItem) =>
            programItem.title
              .replace(MULTIPLE_WHITESPACES_REGEX, " ")
              .toLocaleLowerCase()
              .includes(cleanedSearchTerm) ||
            privateSignupMessages.some(
              (signupMessage) =>
                // Id equality first: it rejects almost every message outright,
                // and the name match below is the expensive half
                signupMessage.programItemId === programItem.programItemId &&
                signupMessage.username
                  .toLocaleLowerCase()
                  .includes(cleanedSearchTerm),
            ),
        );

  const privateSignupQuestions = signupQuestions.filter(
    (signupQuestion) => signupQuestion.private,
  );

  const signupQuestionsWithProgramItems = privateSignupQuestions.flatMap(
    (privateSignupQuestion) => {
      const matchingProgramItem = filteredProgramItems.find(
        (programItem) =>
          programItem.programItemId === privateSignupQuestion.programItemId,
      );
      if (!matchingProgramItem) {
        return [];
      }
      return { ...privateSignupQuestion, programItem: matchingProgramItem };
    },
  );

  const groupedSignupQuestions = groupBy(
    sortBy(
      signupQuestionsWithProgramItems,
      (signupQuestion) => signupQuestion.programItem.startTime,
    ),
    (signupQuestion) => signupQuestion.programItem.startTime,
  );

  const groupedSignupMessages = groupBy(
    privateSignupMessages,
    (signupQuestion) => signupQuestion.programItemId,
  );

  return (
    <div>
      <h3>{t("helperView.signupQuestionAnswers")}</h3>
      <p>{t("helperView.privateSignupMessagesInfo")}</p>

      <ControlledInput
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder={t("findTitleOrUsername", {
          PROGRAM_TYPE: t(`programTypeGenetive.${programTypeForTexts}`),
        })}
        resetValue={() => setSearchTerm("")}
      />

      {Object.entries(groupedSignupQuestions).map(
        ([startTime, signupQuestionsWithProgramItem]) => {
          const sortedSignupQuestions = sortBy(
            signupQuestionsWithProgramItem,
            (signupQuestion) =>
              signupQuestion.programItem.title.toLocaleLowerCase(),
          );

          return (
            <div key={startTime}>
              <h3>{capitalize(getWeekdayAndTime(startTime))}</h3>
              {sortedSignupQuestions.map((signupQuestionWitProgramItem) => {
                const matchingSignupMessages =
                  groupedSignupMessages[
                    signupQuestionWitProgramItem.programItemId
                  ];

                return (
                  <SingleProgramItemAnswers
                    key={signupQuestionWitProgramItem.programItemId}
                  >
                    <Link
                      to={`${AppRoute.PROGRAM_ITEM}/${signupQuestionWitProgramItem.programItem.programItemId}`}
                    >
                      {signupQuestionWitProgramItem.programItem.title}
                    </Link>{" "}
                    (
                    {t(
                      `programType.${signupQuestionWitProgramItem.programItem.programType}`,
                    )}
                    )
                    <Answers>
                      <BoldText>{t("helperView.question")}: </BoldText>{" "}
                      {signupQuestionWitProgramItem.questionFi} /{" "}
                      {signupQuestionWitProgramItem.questionEn}
                      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
                      {matchingSignupMessages ? (
                        <SignupAnswersContainer>
                          {matchingSignupMessages.map((answer) => (
                            <SignupAnswer key={answer.username}>
                              <BoldText>{answer.username}:</BoldText>{" "}
                              {answer.message}
                            </SignupAnswer>
                          ))}
                        </SignupAnswersContainer>
                      ) : (
                        <SignupAnswersContainer>
                          {t("helperView.noPrivateSignupMessages")}
                        </SignupAnswersContainer>
                      )}
                    </Answers>
                  </SingleProgramItemAnswers>
                );
              })}
            </div>
          );
        },
      )}
    </div>
  );
};

const SingleProgramItemAnswers = styled.div`
  margin-bottom: 16px;
`;

const Answers = styled.div`
  margin: 16px 0 0 20px;
`;

const BoldText = styled.span`
  font-weight: 600;
`;

const SignupAnswersContainer = styled.div`
  margin: 16px 0 0 20px;
`;

const SignupAnswer = styled.li`
  list-style-type: none;
  margin: 0 0 6px 0;
`;
