import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import _ from 'lodash';
import styled from 'styled-components';
import { timeFormatter } from 'utils/timeFormatter';
import { updateFavorite, UpdateFavoriteOpts } from 'utils/favorite';
import { Game } from 'typings/game.typings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { UserGroup } from 'typings/user.typings';
import { RootState } from 'typings/redux.typings';

export interface Props {
  games: readonly Game[];
}

export const AllGamesList: FC<Props> = (props: Props): ReactElement => {
  const { games } = props;
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const username: string = useSelector(
    (state: RootState) => state.login.username
  );
  const loggedIn: boolean = useSelector(
    (state: RootState) => state.login.loggedIn
  );
  const userGroup: UserGroup = useSelector(
    (state: RootState) => state.login.userGroup
  );
  const favoritedGames: readonly Game[] = useSelector(
    (state: RootState) => state.myGames.favoritedGames
  );

  // Favorite / remove favorite clicked
  const updateFavoriteHandler = async (
    game: Game,
    action: string
  ): Promise<void> => {
    if (!game || !game.gameId) return;

    const updateFavoriteOpts: UpdateFavoriteOpts = {
      game,
      action,
      username,
      favoritedGames,
      dispatch,
    };

    await updateFavorite(updateFavoriteOpts);
  };

  const buildGamesList = (games: readonly Game[]): ReactElement[] => {
    const sortedGames = _.sortBy(games, [
      (game) => game.startTime,
      (game) => game.title.toLowerCase(),
    ]);

    const groupedGames = _.groupBy(sortedGames, 'startTime');

    const GamesList: ReactElement[] = [];

    for (const [startTime, games] of Object.entries(groupedGames)) {
      const formattedStartTime = timeFormatter.weekdayAndTime({
        time: startTime,
        capitalize: true,
      });
      const signupStartTime = timeFormatter.startTime(startTime);
      const signupEndTime = timeFormatter.endTime(startTime);

      const allGamesRevolvingDoor = games.every((game) => game.revolvingDoor);

      const title = (
        <GameListTitle key={startTime}>
          <span className='game-startup-time'>{formattedStartTime}</span>
          {!allGamesRevolvingDoor && (
            <span className='game-signup-time'>
              {' '}
              ({t('signupOpenBetween')} {signupStartTime}-{signupEndTime})
            </span>
          )}
        </GameListTitle>
      );

      GamesList.push(title);

      for (const game of games) {
        // Check if in favorites
        const favorited =
          favoritedGames.find(
            (favoritedGame) => favoritedGame.gameId === game.gameId
          ) !== undefined;

        const gameEntry = (
          <div key={game.gameId} className='games-list'>
            {favorited && loggedIn && userGroup === 'user' && game && (
              <IconContainer
                onClick={async () => await updateFavoriteHandler(game, 'del')}
              >
                <FontAwesomeIcon icon='heart' />
              </IconContainer>
            )}
            {!favorited && loggedIn && userGroup === 'user' && game && (
              <IconContainer
                onClick={async () => await updateFavoriteHandler(game, 'add')}
              >
                <FontAwesomeIcon icon={['far', 'heart']} />
              </IconContainer>
            )}
            <Link to={`/games/${game.gameId}`}>{game.title}</Link>{' '}
            <GameListShortDescription>
              {t(`programType.${game.programType}`)}:{' '}
              {game.shortDescription ? game.shortDescription : game.gameSystem}
            </GameListShortDescription>
          </div>
        );

        GamesList.push(gameEntry);
      }
    }

    return GamesList;
  };

  const GamesList = buildGamesList(games);

  return (
    <div className='games-list'>
      {games.length === 0 && <h3>{t('noProgramItemsAvailable')}</h3>}
      {games.length !== 0 && <>{GamesList}</>}
    </div>
  );
};

const IconContainer = styled.span`
  span {
    position: relative;
    top: 6px;
  }
`;

const GameListTitle = styled.h3`
  margin: 20px 0;
`;

const GameListShortDescription = styled.p`
  font-size: ${(props) => props.theme.fontSizeSmall};
  font-style: italic;
  margin: 4px 0 8px 14px;
`;
