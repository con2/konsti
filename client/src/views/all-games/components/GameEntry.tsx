import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { ProgramItem } from "shared/types/models/programItem";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { Signup, UserGroup } from "shared/types/models/user";
import { RaisedCard } from "client/components/RaisedCard";
import {
  isAlreadyDirectySigned,
  isAlreadyLotterySigned,
} from "client/views/all-games/components/allGamesUtils";
import { config } from "shared/config";
import { GameDetailsView } from "client/views/all-games/components/GameDetailsView";
import { SignupInfo } from "client/views/all-games/components/SignupInfo";
import { GameHead } from "client/views/all-games/components/GameHead";

interface Props {
  game: ProgramItem;
  startTime: string;
  players: number;
  signupStrategy: SignupStrategy;
  lotterySignups: readonly Signup[];
  directSignups: readonly Signup[];
  isAlwaysExpanded: boolean;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  username: string;
  loggedIn: boolean;
  userGroup: UserGroup;
  favoritedGames: readonly ProgramItem[];
}

export const GameEntry = ({
  game,
  startTime,
  players,
  signupStrategy,
  lotterySignups,
  directSignups,
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

  const isDirectlySignedCurrentGame = isAlreadyDirectySigned(
    game,
    directSignups,
  );
  const isLotterySignedForCurrentGame = isAlreadyLotterySigned(
    game,
    lotterySignups,
  );

  const isGameSigned = isEnterGameMode
    ? isDirectlySignedCurrentGame
    : isLotterySignedForCurrentGame;

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
