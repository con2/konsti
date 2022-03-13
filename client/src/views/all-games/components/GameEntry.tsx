import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { updateFavorite, UpdateFavoriteOpts } from "client/utils/favorite";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { Game } from "shared/typings/models/game";
import { AlgorithmSignupForm } from "./AlgorithmSignupForm";
import { DirectSignupForm } from "./DirectSignupForm";
import { Button } from "client/components/Button";

const DESCRIPTION_SENTENCES_LENGTH = 3;
const matchNextSentence = /([.?!])\s*(?=[A-Z])/g;

interface Props {
  game: Game;
  startTime: string;
  players: number;
  signupStrategy: SignupStrategy;
}

export const GameEntry = ({
  game,
  startTime,
  players,
  signupStrategy,
}: Props): ReactElement => {
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

  const isEnterGameMode = signupStrategy === SignupStrategy.DIRECT;
  const gameIsFull = game.maxAttendance === players;

  const formatDuration = (mins: number): string => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;

    const hoursStr = hours === 0 ? "" : `${hours}h`;
    const minutesStr = minutes === 0 ? "" : `${minutes}min`;

    return `${hoursStr} ${minutesStr}`;
  };

  // Favorite / remove favorite clicked
  const updateFavoriteHandler = async (
    updateOpts: UpdateFavoriteOpts
  ): Promise<void> => {
    if (!updateOpts?.game || !updateOpts?.game?.gameId) return;

    await updateFavorite(updateOpts);
  };

  return (
    <GameContainer key={game.gameId}>
      <GameHeader>
        <HeaderContainer>
          <h3>{game.title}</h3>
          <p>
            {t("signup.expectedDuration", {
              EXPECTED_DURATION: formatDuration(game.mins),
            })}
          </p>
          <PlayerCount visible={isEnterGameMode}>
            {t("signup.signupCount", {
              PLAYERS: players,
              MAX_ATTENDANCE: game.maxAttendance,
            })}
          </PlayerCount>
          <PlayersNeeded visible={players < game.minAttendance}>
            {t("signup.playerNeeded", { COUNT: game.minAttendance - players })}
          </PlayersNeeded>
        </HeaderContainer>
        <GameTags>
          {favorited && loggedIn && userGroup === "user" && game && (
            <FavoriteButton
              onClick={async () =>
                await updateFavoriteHandler({
                  game,
                  action: "del",
                  favoritedGames,
                  username,
                  dispatch,
                })
              }
            >
              <FavoriteIcon icon="heart" />
            </FavoriteButton>
          )}
          {!favorited && loggedIn && userGroup === "user" && game && (
            <FavoriteButton
              onClick={async () =>
                await updateFavoriteHandler({
                  game,
                  action: "add",
                  favoritedGames,
                  username,
                  dispatch,
                })
              }
            >
              <FavoriteIcon icon={["far", "heart"]} />
            </FavoriteButton>
          )}
          <TagColumn>
            <Tag>{t(`programType.${game.programType}`)}</Tag>
            {game.gameSystem && <Tag>{game.gameSystem}</Tag>}
          </TagColumn>
        </GameTags>
      </GameHeader>
      <GameMoreInfoRow>
        <GameListShortDescription>
          {game.shortDescription ??
            game.description
              .replace(matchNextSentence, "$1|")
              .split("|")
              .slice(0, DESCRIPTION_SENTENCES_LENGTH)
              .join(" ")}{" "}
          <Link to={`/games/${game.gameId}`}>{t("gameInfo.readMore")}</Link>
        </GameListShortDescription>
      </GameMoreInfoRow>
      {loggedIn && isEnterGameMode && (
        <DirectSignupForm
          game={game}
          gameIsFull={gameIsFull}
          startTime={startTime}
        />
      )}
      {loggedIn && !isEnterGameMode && (
        <AlgorithmSignupForm game={game} startTime={startTime} />
      )}
    </GameContainer>
  );
};

const PlayersNeeded = styled("span")<{ visible: boolean }>`
  margin-top: 8px;
  display: ${(props) => (props.visible ? "block" : "none")};
`;

const PlayerCount = styled("span")<{ visible: boolean }>`
  margin-top: 8px;
  display: ${(props) => (props.visible ? "block" : "none")};
`;

const FavoriteButton = styled(Button)`
  margin: 0 16px;
  width: 60px;
  max-height: 50px;
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
  flex-direction: column;

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
  background: ${(props) => props.theme.tagBackground};
  padding: 4px;
  margin-bottom: 4px;
  font-size: 12px;
  color: ${(props) => props.theme.tagTextColor};
`;

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px;
  margin: 4px 16px 24px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fafafa;
  min-height: 160px;
  box-shadow: 1px 8px 15px 0 rgba(0, 0, 0, 0.42);
  color: #3d3d3d;
`;

const GameListShortDescription = styled.p`
  font-size: ${(props) => props.theme.fontSizeSmall};
  font-style: italic;
`;

const GameTags = styled.div`
  display: flex;
`;

const FavoriteIcon = styled(FontAwesomeIcon)`
  color: ${(props) => props.theme.favorited};
`;
