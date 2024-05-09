import { ReactElement, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { groupBy, sortBy, capitalize } from "lodash-es";
import styled from "styled-components";
import { useAppSelector } from "client/utils/hooks";
import { ProgramItem } from "shared/types/models/programItem";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { ControlledInput } from "client/components/ControlledInput";
import { MULTIPLE_WHITESPACES_REGEX } from "client/views/all-program-items/AllProgramItemsView";

export const PrivateSignupMessages = (): ReactElement => {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredGames, setFilteredGames] = useState<readonly ProgramItem[]>(
    [],
  );

  const programItems = useAppSelector(
    (state) => state.allProgramItems.programItems,
  );
  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions,
  );
  const signupMessages = useAppSelector((state) => state.admin.signupMessages);
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType,
  );

  const privateSignupQuestions = signupQuestions.filter(
    (signupQuestion) => signupQuestion.private,
  );

  const signupQuestionsWithProgramItems = privateSignupQuestions.flatMap(
    (privateSignupQuestion) => {
      const matchingProgramItem = filteredGames.find(
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
    sortBy(signupQuestionsWithProgramItems, "game.startTime"),
    "game.startTime",
  );

  const privateSignupMessages = signupMessages.filter(
    (signupMessage) => signupMessage.private,
  );

  const groupedSignupMessages = groupBy(privateSignupMessages, "programItemId");

  useEffect(() => {
    if (searchTerm.length === 0) {
      setFilteredGames(programItems);
      return;
    }

    const gamesFilteredBySearchTerm = programItems.filter((programItem) => {
      return (
        programItem.title
          .replace(MULTIPLE_WHITESPACES_REGEX, " ")
          .toLocaleLowerCase()
          .includes(searchTerm.toLocaleLowerCase()) ||
        privateSignupMessages.find(
          (signupMessage) =>
            signupMessage.username
              .toLocaleLowerCase()
              .includes(searchTerm.toLocaleLowerCase()) &&
            signupMessage.programItemId === programItem.programItemId,
        )
      );
    });

    setFilteredGames(gamesFilteredBySearchTerm);
  }, [searchTerm, programItems]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h3>{t("helperView.signupQuestionAnswers")}</h3>
      <p>{t("helperView.privateSignupMessagesInfo")}</p>

      <ControlledInput
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder={t("findTitleOrUsername", {
          PROGRAM_TYPE: t(`programTypeGenetive.${activeProgramType}`),
        })}
        resetValue={() => setSearchTerm("")}
      />

      {Object.entries(groupedSignupQuestions).map(
        ([startTime, signupQuestionsWithGame]) => {
          const sortedSignupQuestions = sortBy(signupQuestionsWithGame, [
            (signupQuestion) =>
              signupQuestion.programItem.title.toLocaleLowerCase(),
          ]);

          return (
            <div key={startTime}>
              <h3>{capitalize(getWeekdayAndTime(startTime))}</h3>
              {sortedSignupQuestions.map((signupQuestionWithGame) => {
                const matchingSignupMessages =
                  groupedSignupMessages[signupQuestionWithGame.programItemId];

                return (
                  <SingleGameAnswers key={signupQuestionWithGame.programItemId}>
                    <Link
                      to={`/games/${signupQuestionWithGame.programItem.programItemId}`}
                    >
                      {signupQuestionWithGame.programItem.title}
                    </Link>{" "}
                    (
                    {t(
                      `programType.${signupQuestionWithGame.programItem.programType}`,
                    )}
                    )
                    <Answers>
                      <BoldText>{t("helperView.question")}: </BoldText>{" "}
                      {signupQuestionWithGame.questionFi} /{" "}
                      {signupQuestionWithGame.questionEn}
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
                  </SingleGameAnswers>
                );
              })}
            </div>
          );
        },
      )}
    </div>
  );
};

const SingleGameAnswers = styled.div`
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
