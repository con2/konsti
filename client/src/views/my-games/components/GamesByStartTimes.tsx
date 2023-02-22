import React, { Fragment, ReactElement } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { timeFormatter } from "client/utils/timeFormatter";
import { Game } from "shared/typings/models/game";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { updateFavorite } from "client/utils/favorite";
import {
  FavoriteButton,
  FavoriteButtonSize,
} from "client/components/FavoriteButton";

interface Props {
  games: readonly Game[];
  startTimes: readonly string[];
}

export const GamesByStartTimes = ({
  games,
  startTimes,
}: Props): ReactElement => {
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.login.username);
  const favoritedGames = useAppSelector(
    (state) => state.myGames.favoritedGames
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
              {timeFormatter.getWeekdayAndTime({
                time: startTime,
                capitalize: true,
              })}
            </StyledTime>

            {games.map((game) => {
              if (game.startTime === startTime) {
                return (
                  <GameDetailsRow key={game.gameId}>
                    <FavoriteButton
                      buttonSize={FavoriteButtonSize.SMALL}
                      isFavorite={true}
                      onClick={async () => {
                        await removeFavorite(game);
                      }}
                    />
                    <Link
                      to={`/games/${game.gameId}`}
                      data-testid={"game-title"}
                    >
                      {game.title}
                    </Link>
                  </GameDetailsRow>
                );
              }
            })}
          </Fragment>
        );
      })}
    </>
  );
};

const GameDetailsRow = styled.p`
  align-items: center;
  justify-content: left;
  margin: 0 0 8px 0;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    margin: 0 0 8px 0;
  }
`;

const StyledTime = styled.p`
  font-weight: 600;
  margin: 10px 0;
`;
