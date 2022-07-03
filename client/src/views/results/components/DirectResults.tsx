import _ from "lodash";
import React, { ReactElement, useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { timeFormatter } from "client/utils/timeFormatter";
import { useAppSelector } from "client/utils/hooks";
import { getUsersForGameId } from "client/views/results/resultsUtils";
import { getUpcomingGames } from "client/utils/getUpcomingGames";
import { Button, ButtonStyle } from "client/components/Button";
import { Game } from "shared/typings/models/game";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { selectActiveGames } from "client/views/admin/adminSlice";

export const DirectResults = (): ReactElement => {
  const { t } = useTranslation();

  const activeGames = useAppSelector(selectActiveGames);
  const signups = useAppSelector((state) => state.allGames.signups);
  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions
  );
  const hiddenGames = useAppSelector((state) => state.admin.hiddenGames);

  const [showAllGames, setShowAllGames] = useState<boolean>(false);
  const [showSignupMessages, setShowSignupMessages] = useState<string[]>([]);
  const [showPlayers, setShowPlayers] = useState<string[]>([]);

  const publicSignupQuestions = signupQuestions.filter(
    (signupQuestion) => !signupQuestion.private
  );

  const visibleGames = activeGames
    .filter((activeGame) => activeGame.signupStrategy === SignupStrategy.DIRECT)
    .filter((activeGame) =>
      hiddenGames.every((hiddenGame) => activeGame.gameId !== hiddenGame.gameId)
    );

  const filteredGames = showAllGames
    ? _.sortBy(visibleGames, "startTime")
    : _.sortBy(getUpcomingGames(visibleGames, 1), "startTime");

  const [gamesForListing, setGamesForListing] = useState<readonly Game[]>([]);
  const [filteredGamesForListing, setFilteredGamesForListing] = useState<{
    [key: string]: Game[];
  }>({});
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    if (_.isEqual(filteredGames, gamesForListing)) {
      return;
    }

    setGamesForListing(filteredGames);
  }, [filteredGames]);

  useEffect(() => {
    if (searchTerm.length === 0) {
      const gamesByStartTime = _.groupBy<Game>(gamesForListing, "startTime");
      setFilteredGamesForListing(gamesByStartTime);
      return;
    }

    const gamesFilteredBySearchTerm = gamesForListing.filter((game) => {
      const users = getUsersForGameId(game.gameId, signups);
      return (
        game.title.toLocaleLowerCase().includes(searchTerm) ||
        users.some((user) =>
          user.username.toLocaleLowerCase().includes(searchTerm)
        )
      );
    });

    const gamesByStartTime = _.groupBy<Game>(
      gamesFilteredBySearchTerm,
      "startTime"
    );

    setFilteredGamesForListing(gamesByStartTime);
  }, [searchTerm, gamesForListing]);

  return (
    <div>
      <h2>{t("resultsView.allSignupResults")}</h2>

      <SearchInput
        type="text"
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder={t("findSignupOrGame")}
      />
      <div>
        <Button
          onClick={() => setShowAllGames(false)}
          buttonStyle={
            !showAllGames ? ButtonStyle.DISABLED : ButtonStyle.NORMAL
          }
        >
          {t("lastStartedAndUpcomingGames")}
        </Button>
        <Button
          onClick={() => setShowAllGames(true)}
          buttonStyle={showAllGames ? ButtonStyle.DISABLED : ButtonStyle.NORMAL}
        >
          {t("allGames")}
        </Button>
      </div>

      {filteredGames.length === 0 && <h3>{t("resultsView.noResults")}</h3>}

      {Object.entries(filteredGamesForListing).map(
        ([startTime, gamesForTime]) => {
          const sortedGamesForTime = _.sortBy(gamesForTime, [
            (game) => game.title.toLocaleLowerCase(),
          ]);

          return (
            <TimeSlot key={startTime}>
              <h3>
                {timeFormatter.getWeekdayAndTime({
                  time: startTime,
                  capitalize: true,
                })}
              </h3>

              <Games>
                {sortedGamesForTime.map((game) => {
                  const signupQuestion = publicSignupQuestions.find(
                    (question) => question.gameId === game.gameId
                  );
                  const signupMessagesVisible = showSignupMessages.find(
                    (message) => message === game.gameId
                  );
                  const playerListVisible = showPlayers.find(
                    (players) => players === game.gameId
                  );
                  const users = getUsersForGameId(game.gameId, signups);

                  return (
                    <div key={game.gameId}>
                      <ResultTitle key={game.gameId}>
                        {game.title}{" "}
                        <Tag>{t(`programType.${game.programType}`)}</Tag>{" "}
                        {!!signupQuestion &&
                          (signupMessagesVisible ? (
                            <FontAwesomeIcon
                              icon={"comment"}
                              onClick={() =>
                                setShowSignupMessages(
                                  showSignupMessages.filter(
                                    (message) => message !== game.gameId
                                  )
                                )
                              }
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={["far", "comment"]}
                              onClick={() =>
                                setShowSignupMessages([
                                  ...showSignupMessages,
                                  game.gameId,
                                ])
                              }
                            />
                          ))}
                      </ResultTitle>

                      <PlayerContainer>
                        <PlayerCount
                          onClick={() => {
                            if (playerListVisible) {
                              setShowPlayers(
                                showPlayers.filter(
                                  (gameId) => gameId !== game.gameId
                                )
                              );
                            } else {
                              setShowPlayers([...showPlayers, game.gameId]);
                            }
                          }}
                        >
                          <span>
                            {t("resultsView.players")}: {users.length}/
                            {game.maxAttendance}
                          </span>
                          <FontAwesomeIcon
                            icon={[
                              "fas",
                              playerListVisible ? "angle-up" : "angle-down",
                            ]}
                          />
                        </PlayerCount>
                        {playerListVisible && (
                          <PlayerList>
                            {users.length === 0 ? (
                              <p>{t("resultsView.noSignups")}</p>
                            ) : (
                              users.map((user) => (
                                <p key={user.username}>
                                  {user.username}
                                  {signupMessagesVisible && (
                                    <span>: {user.signupMessage}</span>
                                  )}
                                </p>
                              ))
                            )}
                          </PlayerList>
                        )}
                      </PlayerContainer>

                      {signupMessagesVisible && (
                        <SignupQuestion>
                          {signupQuestion?.message}
                        </SignupQuestion>
                      )}
                    </div>
                  );
                })}
              </Games>
            </TimeSlot>
          );
        }
      )}
    </div>
  );
};

const ResultTitle = styled.h4`
  display: flex;
  flex-direction: column;
  margin-bottom: 4px;
`;

const TimeSlot = styled.div`
  border-radius: 4px;
  border: 1px solid #ddd;
  box-shadow: 1px 8px 15px 0 rgba(0, 0, 0, 0.42);
  margin: 0 0 24px 0;
  padding: 0 10px 20px 10px;
`;

const Games = styled.div`
  display: grid;
  grid-gap: 30px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  padding: 0 10px 0 30px;
`;

const PlayerList = styled.div`
  padding: 0 0 0 30px;
`;

const PlayerContainer = styled.div`
  border: 1px solid ${(props) => props.theme.resultsFoldBorder};
  border-radius: 4px;
  background-color: ${(props) => props.theme.resultsFoldBackground};
`;

const PlayerCount = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 4px;
  cursor: pointer;
`;

const SignupQuestion = styled.p`
  font-weight: 600;
`;

const SearchInput = styled.input`
  border: 1px solid ${(props) => props.theme.borderInactive};
  color: ${(props) => props.theme.buttonText};
  height: 34px;
  padding: 0 0 0 10px;
  width: 100%;
`;

const Tag = styled.span`
  border-radius: 4px;
  background: ${(props) => props.theme.backgroundTag};
  padding: 4px;
  font-size: 12px;
  color: ${(props) => props.theme.textTag};
  white-space: nowrap;
  margin-top: 4px;
  max-width: fit-content;
`;
