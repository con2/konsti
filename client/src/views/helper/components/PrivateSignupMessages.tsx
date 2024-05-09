import { ReactElement, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { groupBy, sortBy, capitalize } from "lodash-es";
import styled from "styled-components";
import { useAppSelector } from "client/utils/hooks";
import { ProgramItem } from "shared/types/models/programItem";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { ControlledInput } from "client/components/ControlledInput";
import { MULTIPLE_WHITESPACES_REGEX } from "client/views/all-games/AllGamesView";

export const PrivateSignupMessages = (): ReactElement => {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredGames, setFilteredGames] = useState<readonly ProgramItem[]>(
    [],
  );

  const games = useAppSelector((state) => state.allGames.games);
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

  const signupQuestionsWithGames = privateSignupQuestions.flatMap(
    (privateSignupQuestion) => {
      const matchingGame = filteredGames.find(
        (game) => game.gameId === privateSignupQuestion.gameId,
      );
      if (!matchingGame) {
        return [];
      }
      return { ...privateSignupQuestion, game: matchingGame };
    },
  );

  const groupedSignupQuestions = groupBy(
    sortBy(signupQuestionsWithGames, "game.startTime"),
    "game.startTime",
  );

  const privateSignupMessages = signupMessages.filter(
    (signupMessage) => signupMessage.private,
  );

  const groupedSignupMessages = groupBy(privateSignupMessages, "gameId");

  useEffect(() => {
    if (searchTerm.length === 0) {
      setFilteredGames(games);
      return;
    }

    const gamesFilteredBySearchTerm = games.filter((game) => {
      return (
        game.title
          .replace(MULTIPLE_WHITESPACES_REGEX, " ")
          .toLocaleLowerCase()
          .includes(searchTerm.toLocaleLowerCase()) ||
        privateSignupMessages.find(
          (signupMessage) =>
            signupMessage.username
              .toLocaleLowerCase()
              .includes(searchTerm.toLocaleLowerCase()) &&
            signupMessage.gameId === game.gameId,
        )
      );
    });

    setFilteredGames(gamesFilteredBySearchTerm);
  }, [searchTerm, games]); // eslint-disable-line react-hooks/exhaustive-deps

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
            (signupQuestion) => signupQuestion.game.title.toLocaleLowerCase(),
          ]);

          return (
            <div key={startTime}>
              <h3>{capitalize(getWeekdayAndTime(startTime))}</h3>
              {sortedSignupQuestions.map((signupQuestionWithGame) => {
                const matchingSignupMessages =
                  groupedSignupMessages[signupQuestionWithGame.gameId];

                return (
                  <SingleGameAnswers key={signupQuestionWithGame.gameId}>
                    <Link to={`/games/${signupQuestionWithGame.game.gameId}`}>
                      {signupQuestionWithGame.game.title}
                    </Link>{" "}
                    (
                    {t(
                      `programType.${signupQuestionWithGame.game.programType}`,
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
