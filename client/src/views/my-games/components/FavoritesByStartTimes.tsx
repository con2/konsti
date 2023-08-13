import { Fragment, ReactElement } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { Game } from "shared/typings/models/game";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { updateFavorite } from "client/utils/favorite";
import { IconButton } from "client/components/IconButton";

interface Props {
  games: readonly Game[];
  startTimes: readonly string[];
}

export const FavoritesByStartTimes = ({
  games,
  startTimes,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.login.username);
  const favoritedGames = useAppSelector(
    (state) => state.myGames.favoritedGames,
  );

  const removeFavorite = async (game: Game): Promise<void> => {
    await updateFavorite({
      game,
      action: "del",
      favoritedGames,
      username,
      dispatch,
    });
  };

  return (
    <>
      {startTimes.map((startTime) => {
        return (
          <Fragment key={startTime}>
            <StyledTime>
              {_.capitalize(getWeekdayAndTime(startTime))}
            </StyledTime>

            <ul>
              {games.map((game) => {
                if (game.startTime === startTime) {
                  return (
                    <GameDetailsRow key={game.gameId}>
                      <StyledLink
                        to={`/games/${game.gameId}`}
                        data-testid={"game-title"}
                      >
                        {game.title}
                      </StyledLink>
                      <IconButton
                        icon="heart-circle-xmark"
                        onClick={async () => {
                          await removeFavorite(game);
                        }}
                        ariaLabel={t("iconAltText.deleteFavorite")}
                      />
                    </GameDetailsRow>
                  );
                }
              })}
            </ul>
          </Fragment>
        );
      })}
    </>
  );
};

const GameDetailsRow = styled.li`
  align-items: center;
  justify-content: left;
  margin-bottom: 8px;
  list-style: none;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    justify-content: space-between;
  }
`;

const StyledTime = styled.p`
  font-weight: 600;
  margin: 10px 0;
`;

const StyledLink = styled(Link)`
  margin-right: 8px;
`;
