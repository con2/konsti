import React, { FC, ReactElement, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Game } from 'shared/typings/models/game';
import { updateFavorite, UpdateFavoriteOpts } from 'client/utils/favorite';
import {
  getSignedGames,
  getUpcomingEnteredGames,
} from 'client/utils/getUpcomingGames';
import { SignupForm } from './SignupForm';
import {
  submitSignup,
  submitSelectedGames,
} from 'client/views/signup/signupActions';
import { SelectedGame } from 'shared/typings/models/user';
import { useAppDispatch, useAppSelector } from 'client/utils/hooks';

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

export const GameEntry: FC<Props> = (props: Props): ReactElement => {
  const { game, startTime } = props;

  const { t } = useTranslation();

  const username = useAppSelector((state) => state.login.username);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const userGroup = useAppSelector((state) => state.login.userGroup);
  const favoritedGames = useAppSelector(
    (state) => state.myGames.favoritedGames
  );
  const serial = useAppSelector((state) => state.login.serial);
  const groupCode = useAppSelector((state) => state.login.groupCode);
  const signedGames = useAppSelector((state) => state.myGames.signedGames);
  const enteredGames = useAppSelector((state) => state.myGames.enteredGames);
  const groupMembers = useAppSelector((state) => state.login.groupMembers);
  const [signupFormOpen, setSignupFormOpen] = useState(false);

  const dispatch = useAppDispatch();

  const favorited =
    favoritedGames.find(
      (favoritedGame) => favoritedGame.gameId === game.gameId
    ) !== undefined;

  const isAlreadySigned = (game: Game): boolean => {
    const allSignedGames = getSignedGames(
      signedGames,
      groupCode,
      serial,
      groupMembers,
      true
    );
    const allEnteredGames = getUpcomingEnteredGames(enteredGames);

    return [...allSignedGames, ...allEnteredGames].some(
      (g: SelectedGame) => g.gameDetails.gameId === game.gameId
    );
  };

  const removeSignup = async (game: Game): Promise<void> => {
    const allSignedGames = getSignedGames(
      signedGames,
      groupCode,
      serial,
      groupMembers,
      true
    );
    const allEnteredGames = getUpcomingEnteredGames(enteredGames);
    const newSignupData = [...allSignedGames, ...allEnteredGames].filter(
      (g: SelectedGame) => g.gameDetails.gameId !== game.gameId
    );
    dispatch(submitSelectedGames(newSignupData));
    const signupData = {
      username,
      selectedGames: newSignupData,
      signupTime: game.startTime,
    };

    await dispatch(submitSignup(signupData));
  };

  const currentPriority = signedGames.find(
    (g) => g.gameDetails.gameId === game.gameId
  )?.priority;

  const signedGamesForTimeslot = signedGames.filter(
    (g) => g.gameDetails.startTime === startTime
  );

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
          Lisaa suosikkeihin
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
          Poista suosikeista
        </FavoriteButton>
      )}
      <GameMoreInfoRow>
        <GameListShortDescription>
          {game.shortDescription}
          <Link to={`/games/${game.gameId}`}>{t('gameInfo.readMore')}</Link>
        </GameListShortDescription>
      </GameMoreInfoRow>
      {loggedIn && (
        <>
          {!isAlreadySigned(game) && signedGamesForTimeslot.length >= 3 && (
            <p>{t('signup.cannotSignupMoreGames')}</p>
          )}
          {!isAlreadySigned(game) && signedGamesForTimeslot.length < 3 && (
            <button onClick={() => setSignupFormOpen(!signupFormOpen)}>
              {t('signup.signup')}
            </button>
          )}
          {isAlreadySigned(game) && (
            <>
              <button onClick={async () => await removeSignup(game)}>
                {t('button.cancel')}
              </button>
              <p>
                {t('signup.alreadySigned', {
                  CURRENT_PRIORITY: currentPriority,
                })}
              </p>
            </>
          )}
          {signupFormOpen && !isAlreadySigned(game) && (
            <SignupForm game={game} startTime={startTime} />
          )}
        </>
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
