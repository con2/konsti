import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Game } from "shared/types/models/game";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { Signup, UserGroup } from "shared/types/models/user";
import { RaisedCard } from "client/components/RaisedCard";
import {
  isAlreadyEntered,
  isAlreadySigned,
} from "client/views/all-games/components/allGamesUtils";
import { config } from "shared/config";
import { GameDetailsView } from "client/views/all-games/components/GameDetailsView";
import { SignupInfo } from "client/views/all-games/components/SignupInfo";
import { GameHead } from "client/views/all-games/components/GameHead";

interface Props {
  game: Game;
  startTime: string;
  players: number;
  signupStrategy: SignupStrategy;
  lotterySignups: readonly Signup[];
  enteredGames: readonly Signup[];
  isAlwaysExpanded: boolean;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  username: string;
  loggedIn: boolean;
  userGroup: UserGroup;
  favoritedGames: readonly Game[];
}

export const GameEntry = ({
  game,
  startTime,
  players,
  signupStrategy,
  lotterySignups,
  enteredGames,
  isAlwaysExpanded,
  loading,
  setLoading,
  username,
  loggedIn,
  userGroup,
  favoritedGames,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const signupAlwaysOpen = config
    .shared()
    .directSignupAlwaysOpenIds.includes(game.gameId);

  const isEnterGameMode =
    config.shared().manualSignupMode === SignupStrategy.DIRECT ||
    signupStrategy === SignupStrategy.DIRECT ||
    signupAlwaysOpen;

  const isEnteredCurrentGame = isAlreadyEntered(game, enteredGames);
  const isSignedForCurrentGame = isAlreadySigned(game, lotterySignups);

  const isGameSigned = isEnterGameMode
    ? isEnteredCurrentGame
    : isSignedForCurrentGame;

  const tags = [];
  if (config.client().activeProgramTypes.length > 1) {
    tags.push(t(`programType.${game.programType}`));
  }
  if (game.gameSystem) {
    tags.push(game.gameSystem);
  }
  tags.push(t(`programItemLanguage.${game.language}`));

  return (
    <StyledCard isHighlighted={isGameSigned} data-testid="game-container">
      <GameHead
        game={game}
        players={players}
        signupStrategy={signupStrategy}
        username={username}
        loggedIn={loggedIn}
        userGroup={userGroup}
        favoritedGames={favoritedGames}
      />
      <GameDetailsView game={game} isAlwaysExpanded={isAlwaysExpanded} />
      <SignupInfo
        signupStrategy={signupStrategy}
        startTime={startTime}
        lotterySignups={lotterySignups}
        game={game}
        players={players}
        loading={loading}
        setLoading={setLoading}
      />
    </StyledCard>
  );
};

const StyledCard = styled(RaisedCard)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: ${(props) => props.theme.textLighter};
`;
