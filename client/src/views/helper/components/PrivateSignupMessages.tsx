import React, { ReactElement, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitGetSignupMessages } from "client/views/admin/adminThunks";

export const PrivateSignupMessages = (): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const games = useAppSelector((state) => state.allGames.games);
  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions
  );
  const signupMessages = useAppSelector((state) => state.admin.signupMessages);

  const privateSignupMessages = signupMessages.filter(
    (signupMessage) => signupMessage.private
  );

  const groupedSignupMessages = _.groupBy(privateSignupMessages, "gameId");

  useEffect(() => {
    dispatch(submitGetSignupMessages());
  }, []);

  return (
    <div>
      <h3>{t("helperView.signupQuestionAnswers")}</h3>
      <p>{t("helperView.privateSignupMessagesInfo")}</p>

      {Object.entries(groupedSignupMessages).map(([gameId, answers]) => {
        const matchingGame = games.find((game) => game.gameId === gameId);
        if (!matchingGame) return null;

        const matchingSignupQuestion = signupQuestions.find(
          (signupQuestion) => signupQuestion.gameId === gameId
        );
        if (!matchingSignupQuestion) return null;

        return (
          <SingleGameAnswers key={gameId}>
            <Link to={`/games/${matchingGame.gameId}`}>
              {matchingGame.title}
            </Link>{" "}
            <p>{matchingSignupQuestion?.message}</p>
            {answers.map((answer) => (
              <li key={answer.username}>
                {answer.username}: {answer.message}
              </li>
            ))}
          </SingleGameAnswers>
        );
      })}
    </div>
  );
};

const SingleGameAnswers = styled.div`
  margin-bottom: 16px;
`;
