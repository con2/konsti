import _ from "lodash";
import { ReactElement, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { useAppSelector } from "client/utils/hooks";
import { getUsersForGameId } from "client/views/results/resultsUtils";
import { getUpcomingGames } from "client/utils/getUpcomingGames";
import { Game } from "shared/typings/models/game";
import { selectActiveGames } from "client/views/admin/adminSlice";
import { MULTIPLE_WHITESPACES_REGEX } from "client/views/all-games/AllGamesView";
import { Tags } from "client/components/Tags";
import { getAttendeeType } from "client/utils/getAttendeeType";
import { config } from "shared/config";
import { isAdminOrHelp } from "client/utils/checkUserGroup";
import {
  ResultsStartingTimeOption,
  SearchAndFilterResultsCard,
} from "client/views/results/components/SearchAndFilterResultsCard";
import { isRevolvingDoorWorkshop } from "client/utils/isRevolvingDoorWorkshop";

export const DirectResults = (): ReactElement => {
  const { t, i18n } = useTranslation();

  const activeGames = useAppSelector(selectActiveGames);
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType,
  );
  const signups = useAppSelector((state) => state.allGames.signups);
  const userGroup = useAppSelector((state) => state.login.userGroup);
  isAdminOrHelp(userGroup);
  const showResults =
    config.shared().resultsVisible || isAdminOrHelp(userGroup);

  const visibleSignups = useMemo(() => {
    return showResults ? signups : [];
  }, [signups, showResults]);

  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions,
  );
  const hiddenGames = useAppSelector((state) => state.admin.hiddenGames);

  const [selectedStartingTime, setSelectedStartingTime] = useState<string>(
    ResultsStartingTimeOption.ALL,
  );
  const [showSignupMessages, setShowSignupMessages] = useState<string[]>([]);
  const [showPlayers, setShowPlayers] = useState<string[]>([]);

  const publicSignupQuestions = signupQuestions.filter(
    (signupQuestion) => !signupQuestion.private,
  );

  // Filter out hidden program items, revolving door workshops and program items without Konsti signup
  const visibleGames = activeGames
    .filter((activeGame) =>
      hiddenGames.every(
        (hiddenGame) => activeGame.gameId !== hiddenGame.gameId,
      ),
    )
    .filter((activeGame) => !isRevolvingDoorWorkshop(activeGame))
    .filter(
      (activeGame) =>
        !config.shared().noKonstiSignupIds.includes(activeGame.gameId),
    );

  const filteredGames =
    selectedStartingTime === ResultsStartingTimeOption.ALL
      ? _.sortBy(visibleGames, "startTime")
      : _.sortBy(getUpcomingGames(visibleGames, 1), "startTime");

  const [gamesForListing, setGamesForListing] = useState<readonly Game[]>([]);
  const [filteredGamesForListing, setFilteredGamesForListing] = useState<
    Record<string, Game[]>
  >({});
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    if (_.isEqual(filteredGames, gamesForListing)) {
      return;
    }

    setGamesForListing(filteredGames);
  }, [filteredGames, gamesForListing]);

  useEffect(() => {
    if (searchTerm.length === 0) {
      const gamesByStartTime = _.groupBy<Game>(gamesForListing, "startTime");
      setFilteredGamesForListing(gamesByStartTime);
      return;
    }

    const gamesFilteredBySearchTerm = gamesForListing.filter((game) => {
      const users = getUsersForGameId(game.gameId, visibleSignups);
      return (
        game.title
          .replace(MULTIPLE_WHITESPACES_REGEX, " ")
          .toLocaleLowerCase()
          .includes(searchTerm.toLocaleLowerCase()) ||
        users.some((user) =>
          user.username
            .toLocaleLowerCase()
            .includes(searchTerm.toLocaleLowerCase()),
        )
      );
    });

    const gamesByStartTime = _.groupBy<Game>(
      gamesFilteredBySearchTerm,
      "startTime",
    );

    setFilteredGamesForListing(gamesByStartTime);
  }, [searchTerm, gamesForListing, visibleSignups]);

  return (
    <div>
      <h2>{t("resultsView.allSignupResults")}</h2>

      <SearchAndFilterResultsCard
        onSearchTermChange={setSearchTerm}
        onSelectedStartingTimeChange={setSelectedStartingTime}
      />

      {filteredGames.length === 0 && <h3>{t("resultsView.noResults")}</h3>}

      {Object.entries(filteredGamesForListing).map(
        ([startTime, gamesForTime]) => {
          const sortedGamesForTime = _.sortBy(gamesForTime, [
            (game) => game.title.toLocaleLowerCase(),
          ]);

          return (
            <TimeSlot key={startTime}>
              <h3>{_.capitalize(getWeekdayAndTime(startTime))}</h3>

              <Games>
                {sortedGamesForTime.map((game) => {
                  const signupQuestion = publicSignupQuestions.find(
                    (question) => question.gameId === game.gameId,
                  );
                  const signupMessagesVisible = showSignupMessages.find(
                    (message) => message === game.gameId,
                  );
                  const playerListVisible = showPlayers.find(
                    (players) => players === game.gameId,
                  );
                  const users = getUsersForGameId(game.gameId, visibleSignups);

                  return (
                    <div key={game.gameId}>
                      <ResultTitle key={game.gameId}>{game.title} </ResultTitle>
                      {config.shared().activeProgramTypes.length > 1 && (
                        <Tags tags={[t(`programType.${activeProgramType}`)]} />
                      )}
                      <PlayerContainer>
                        <PlayerCount
                          onClick={() => {
                            if (playerListVisible) {
                              setShowPlayers(
                                showPlayers.filter(
                                  (gameId) => gameId !== game.gameId,
                                ),
                              );
                            } else {
                              setShowPlayers([...showPlayers, game.gameId]);
                            }
                          }}
                        >
                          <span>
                            {_.capitalize(
                              t(
                                `attendeeTypePlural.${getAttendeeType(
                                  game.programType,
                                )}`,
                              ),
                            )}
                            : {users.length}/{game.maxAttendance}
                            {!!signupQuestion &&
                              (signupMessagesVisible ? (
                                <CommentIcon
                                  icon={"comment"}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setShowSignupMessages(
                                      showSignupMessages.filter(
                                        (message) => message !== game.gameId,
                                      ),
                                    );
                                  }}
                                />
                              ) : (
                                <CommentIcon
                                  icon={["far", "comment"]}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setShowSignupMessages([
                                      ...showSignupMessages,
                                      game.gameId,
                                    ]);
                                  }}
                                />
                              ))}
                          </span>
                          <FontAwesomeIcon
                            icon={playerListVisible ? "angle-up" : "angle-down"}
                            aria-label={
                              playerListVisible
                                ? t("iconAltText.closeAttendeeList", {
                                    ATTENDEE_TYPE: t(
                                      `attendeeType.${getAttendeeType(
                                        activeProgramType,
                                      )}`,
                                    ),
                                  })
                                : t("iconAltText.openAttendeeList", {
                                    ATTENDEE_TYPE: t(
                                      `attendeeType.${getAttendeeType(
                                        activeProgramType,
                                      )}`,
                                    ),
                                  })
                            }
                          />
                        </PlayerCount>
                        {playerListVisible && (
                          <PlayerList>
                            {signupMessagesVisible && (
                              <SignupQuestion>
                                {i18n.language === "fi"
                                  ? signupQuestion?.questionFi
                                  : signupQuestion?.questionEn}
                              </SignupQuestion>
                            )}
                            {users.length === 0 ? (
                              <p>
                                {t("resultsView.noSignups", {
                                  ATTENDEE_TYPE: t(
                                    `attendeeTypePlural.${getAttendeeType(
                                      activeProgramType,
                                    )}`,
                                  ),
                                })}
                              </p>
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
                    </div>
                  );
                })}
              </Games>
            </TimeSlot>
          );
        },
      )}
    </div>
  );
};

const CommentIcon = styled(FontAwesomeIcon)`
  margin-left: 8px;
`;

const ResultTitle = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 4px;
  font-weight: 600;
`;

const TimeSlot = styled.div`
  border-radius: 4px;
  border: 1px solid #ddd;
  box-shadow: ${(props) => props.theme.shadowHigher};
  margin: 0 0 24px 0;
  padding: 0 10px 20px 10px;
`;

const Games = styled.div`
  display: grid;
  grid-gap: 30px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  margin: 0 10px 0 30px;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    margin-left: 10px;
  }
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
