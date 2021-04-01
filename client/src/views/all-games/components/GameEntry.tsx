import React, { FC, ReactElement, useState, useRef, FormEvent } from 'react';
import { updateFavorite, UpdateFavoriteOpts } from 'utils/favorite';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Game } from 'typings/game.typings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { UserGroup, Signup } from 'typings/user.typings';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typings/redux.typings';
import { submitSignup, submitSelectedGames } from 'views/signup/signupActions';
import { GroupMember } from 'typings/group.typings';
import {
  getSignedGames,
  getUpcomingEnteredGames,
} from 'utils/getUpcomingGames';

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

const SignupForm: FC<Props> = (props: Props): ReactElement => {
  const { game, startTime } = props;

  const dispatch = useDispatch();
  const selectedGames: readonly Signup[] = useSelector(
    (state: RootState) => state.myGames.signedGames
  );
  const username: string = useSelector(
    (state: RootState) => state.login.username
  );
  const priorityRef = useRef<HTMLSelectElement>(null);

  const handleSignup = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!priorityRef.current) {
      return;
    }

    const newGame = [
      {
        gameDetails: game,
        priority: parseInt(priorityRef.current.value, 10),
        time: game.startTime,
      },
    ];

    const combined = selectedGames.concat(newGame);
    dispatch(submitSelectedGames(combined));

    const signupData = {
      username,
      selectedGames: combined,
      signupTime: game.startTime,
    };

    try {
      await dispatch(submitSignup(signupData));
    } catch (error) {
      switch (error.code) {
        case 40:
          console.error('Signup ended');
          return;
        default:
          console.error('signupError');
      }
    }
  };

  const selectedPriorities = selectedGames
    .filter((game) => game.gameDetails.startTime === startTime)
    .map((game) => game.priority);
  const isAlreadySelected = (priority: number) =>
    selectedPriorities.includes(priority);

  return (
    <form>
      Peli on toiveissani sijalla{' '}
      <select ref={priorityRef}>
        <option disabled={isAlreadySelected(1)} value='1'>
          1
        </option>
        <option disabled={isAlreadySelected(2)} value='2'>
          2
        </option>
        <option disabled={isAlreadySelected(3)} value='3'>
          3
        </option>
      </select>
      <button onClick={handleSignup}>Vahvista</button>
    </form>
  );
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
            <p>Voit ilmoittautua vain kolmeen peliin per alkamisaika</p>
          )}
          {!isAlreadySigned(game) && signedGamesForTimeslot.length < 3 && (
            <button onClick={() => setSignupFormOpen(!signupFormOpen)}>
              Ilmoittaudu
            </button>
          )}
          {isAlreadySigned(game) && (
            <>
              <button onClick={async () => await removeSignup(game)}>
                Peruuta
              </button>
              <p>Peli on ilmoittautumisissa sijalla {currentPriority}</p>
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
