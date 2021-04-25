import React, { FC, ReactElement, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Game } from 'shared/typings/models/game';
import { Signup } from 'client/typings/user.typings';
import { RootState } from 'client/typings/redux.typings';
import { GroupMember } from 'client/typings/group.typings';
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
import { UserGroup } from 'shared/typings/models/user';

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
  const serial: string = useSelector((state: RootState) => state.login.serial);
  const groupCode: string = useSelector(
    (state: RootState) => state.login.groupCode
  );
  const signedGames: readonly Signup[] = useSelector(
    (state: RootState) => state.myGames.signedGames
  );
  const enteredGames: readonly Signup[] = useSelector(
    (state: RootState) => state.myGames.enteredGames
  );
  const groupMembers: readonly GroupMember[] = useSelector(
    (state: RootState) => state.login.groupMembers
  );
  const [signupFormOpen, setSignupFormOpen] = useState(false);

  const dispatch = useDispatch();

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
      (g: Signup) => g.gameDetails.gameId === game.gameId
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
      (g: Signup) => g.gameDetails.gameId !== game.gameId
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
      {favorited && loggedIn && userGroup === 'user' && game && (
        <IconContainer
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
          <FontAwesomeIcon icon='heart' />
        </IconContainer>
      )}
      {!favorited && loggedIn && userGroup === 'user' && game && (
        <IconContainer
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
          <FontAwesomeIcon icon={['far', 'heart']} />
        </IconContainer>
      )}
      <Link to={`/games/${game.gameId}`}>{game.title}</Link>{' '}
      <GameListShortDescription>
        {t(`programType.${game.programType}`)}:{' '}
        {game.shortDescription ? game.shortDescription : game.gameSystem}
      </GameListShortDescription>
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

const GameContainer = styled.div`
  padding: 8px;
  margin: 4px;
  border: 1px solid #ccc;
  background-color: #eee;
`;

const IconContainer = styled.span`
  margin-left: 16px;
  span {
    position: relative;
    top: 6px;
  }
`;

const GameListShortDescription = styled.p`
  font-size: ${(props) => props.theme.fontSizeSmall};
  font-style: italic;
  margin: 4px 0 8px 14px;
`;
