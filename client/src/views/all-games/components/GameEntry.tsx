import React, { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Game } from 'shared/typings/models/game';
import { updateFavorite, UpdateFavoriteOpts } from 'client/utils/favorite';
import { useAppDispatch, useAppSelector } from 'client/utils/hooks';
import { sharedConfig } from 'shared/config/sharedConfig';
import { SignupStrategy } from 'shared/config/sharedConfig.types';
import { DirectSignupForm } from './DirectSignupForm';
import { AlgorithmSignupForm } from './AlgorithmSignupForm';

interface Props {
  game: Game;
  startTime: string;
}

// Favorite / remove favorite clicked
const updateFavoriteHandler = async (
  updateOpts: UpdateFavoriteOpts
): Promise<void> => {
  if (!updateOpts?.game || !updateOpts?.game?.gameId) return;

  await updateFavorite(updateOpts);
};

export const GameEntry = ({ game, startTime }: Props): ReactElement => {
  const { t } = useTranslation();

  const username = useAppSelector((state) => state.login.username);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const userGroup = useAppSelector((state) => state.login.userGroup);
  const favoritedGames = useAppSelector(
    (state) => state.myGames.favoritedGames
  );

  const dispatch = useAppDispatch();

  const favorited =
    favoritedGames.find(
      (favoritedGame) => favoritedGame.gameId === game.gameId
    ) !== undefined;

  const isEnterGameMode = sharedConfig.signupStrategy === SignupStrategy.DIRECT;

  return (
    <GameContainer key={game.gameId} className='games-list'>
      <GameHeader>
        <HeaderContainer>
          <h3>{game.title}</h3>
        </HeaderContainer>
        <TagColumn>
          <Tag>{t(`programType.${game.programType}`)}</Tag>
          <Tag>{game.gameSystem}</Tag>
        </TagColumn>
      </GameHeader>
      {favorited && loggedIn && userGroup === 'user' && game && (
        <FavoriteButton
          onClick={async () =>
            await updateFavoriteHandler({
              game,
              action: 'del',
              favoritedGames,
              username,
              dispatch,
            })
          }
        >
          {t('button.favorite')}
        </FavoriteButton>
      )}
      {!favorited && loggedIn && userGroup === 'user' && game && (
        <FavoriteButton
          onClick={async () =>
            await updateFavoriteHandler({
              game,
              action: 'add',
              favoritedGames,
              username,
              dispatch,
            })
          }
        >
          {t('button.removeFavorite')}
        </FavoriteButton>
      )}
      <GameMoreInfoRow>
        <GameListShortDescription>
          {game.shortDescription}
          <Link to={`/games/${game.gameId}`}>{t('gameInfo.readMore')}</Link>
        </GameListShortDescription>
      </GameMoreInfoRow>
      {loggedIn && isEnterGameMode && (
        <DirectSignupForm game={game} startTime={startTime} />
      )}
      {loggedIn && !isEnterGameMode && (
        <AlgorithmSignupForm game={game} startTime={startTime} />
      )}
    </GameContainer>
  );
};

const FavoriteButton = styled.button`
  margin: 0;
  align-self: flex-end;
  width: 130px;
`;

const GameEntryRow = styled.div`
  display: flex;
  flex-direction: row;
`;

const GameHeader = styled(GameEntryRow)`
  justify-content: space-between;
  margin-bottom: 8px;
`;

const HeaderContainer = styled.div`
  display: flex;

  h3 {
    margin: 0;
  }
`;

const TagColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const GameMoreInfoRow = styled(GameEntryRow)`
  justify-content: space-between;
  align-items: center;
`;

const Tag = styled.span`
  min-width: 120px;
  height: 14px;
  text-align: center;
  border-radius: 4px;
  background: #abd0a5;
  padding: 4px;
  margin-bottom: 4px;
  font-size: 12px;
`;

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px;
  margin: 4px 16px 24px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fafafa;
  min-height: 160px;
  box-shadow: 1px 8px 15px 0 rgba(0, 0, 0, 0.42);
  color: #3d3d3d;
`;

const GameListShortDescription = styled.p`
  font-size: ${(props) => props.theme.fontSizeSmall};
  font-style: italic;
`;
