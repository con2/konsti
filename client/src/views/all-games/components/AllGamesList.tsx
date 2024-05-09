import { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { sortBy, groupBy } from "lodash-es";
import styled from "styled-components";
import { GameEntry } from "./GameEntry";
import { useAppSelector } from "client/utils/hooks";
import { ProgramItem } from "shared/types/models/programItem";
import { GameListTitle } from "client/views/all-games/components/GameListTitle";
import { getLotterySignups } from "client/utils/getUpcomingGames";
import { getTimeslotSignupStrategy } from "client/views/all-games/allGamesUtils";
import {
  selectDirectSignups,
  selectFavoritedGames,
  selectLotterySignups,
} from "client/views/my-games/myGamesSlice";
import { RaisedCard } from "client/components/RaisedCard";
import { getIsInGroup } from "client/views/group/groupUtils";

interface Props {
  games: readonly ProgramItem[];
}

export const AllGamesList = ({ games }: Props): ReactElement => {
  const { t } = useTranslation();

  const signups = useAppSelector((state) => state.allGames.directSignups);
  const lotterySignups = useAppSelector(selectLotterySignups);
  const directSignups = useAppSelector(selectDirectSignups);
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType,
  );
  const groupMembers = useAppSelector((state) => state.group.groupMembers);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const username = useAppSelector((state) => state.login.username);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const userGroup = useAppSelector((state) => state.login.userGroup);
  const favoritedGames = useAppSelector(selectFavoritedGames);
  const isInGroup = getIsInGroup(groupCode);

  const [loading, setLoading] = useState(false);

  const ownOrGroupCreatorLotterySignups = getLotterySignups({
    lotterySignups,
    isGroupCreator,
    groupMembers,
    isInGroup,
    getAllGames: true,
  });

  const sortedGames = sortBy(games, [
    (game) => game.startTime,
    (game) => game.title.toLowerCase(),
  ]);

  const gamesByStartTime = groupBy(sortedGames, "startTime");

  const gamesList = Object.entries(gamesByStartTime).map(
    ([startTime, gamesForStartTime]) => {
      const timeslotSignupStrategy =
        getTimeslotSignupStrategy(gamesForStartTime);

      return (
        <div key={startTime}>
          <GameListTitle
            startTime={startTime}
            lotterySignups={ownOrGroupCreatorLotterySignups}
            directSignups={directSignups}
            timeslotSignupStrategy={timeslotSignupStrategy}
            isGroupCreator={isGroupCreator}
            groupCode={groupCode}
          />

          {gamesForStartTime.map((game) => {
            const gameSignups = signups.find(
              (gameSignup) => gameSignup.gameId === game.gameId,
            );

            return (
              <GameEntry
                key={game.gameId}
                isAlwaysExpanded={false}
                game={game}
                startTime={startTime}
                players={gameSignups?.users.length ?? 0}
                signupStrategy={timeslotSignupStrategy}
                lotterySignups={ownOrGroupCreatorLotterySignups}
                directSignups={directSignups}
                loading={loading}
                setLoading={setLoading}
                username={username}
                loggedIn={loggedIn}
                userGroup={userGroup}
                favoritedGames={favoritedGames}
              />
            );
          })}
        </div>
      );
    },
  );

  return (
    <div>
      {games.length === 0 && (
        <RaisedCard>
          <NoGamesText>
            {t("noProgramItemsAvailable", {
              PROGRAM_TYPE: t(
                `programTypePartitivePlural.${activeProgramType}`,
              ),
            })}
          </NoGamesText>
        </RaisedCard>
      )}
      {games.length !== 0 && gamesList}
    </div>
  );
};

const NoGamesText = styled.span`
  color: ${(props) => props.theme.textSecondary};
  font-size: ${(props) => props.theme.fontSizeLarge};
`;
