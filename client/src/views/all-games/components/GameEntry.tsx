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
import { Button, ButtonStyle } from "client/components/Button";
import { SelectedGame } from "shared/typings/models/user";

const DESCRIPTION_SENTENCES_LENGTH = 3;
const matchNextSentence = /([.?!])\s*(?=[A-Z])/g;

interface Props {
  game: Game;
  startTime: string;
  players: number;
  signupStrategy: SignupStrategy;
  signedGames: readonly SelectedGame[];
}

export const GameEntry = ({
  game,
  startTime,
  players,
  signupStrategy,
  signedGames,
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

  const formatPopularityCircleColor = (
    numPlayers: number,
    maxAttendance: number,
    minAttendance: number
  ): string => {
    let popularityColor = "success";
    if (numPlayers > minAttendance && numPlayers < maxAttendance) {
      popularityColor = "critical";
    } else if (numPlayers >= maxAttendance) {
      popularityColor = "warning";
    }
    return popularityColor;
  };
  // Favorite / remove favorite clicked
  const updateFavoriteHandler = async (
    updateOpts: UpdateFavoriteOpts
  ): Promise<void> => {
    if (!updateOpts?.game || !updateOpts?.game?.gameId) return;

    await updateFavorite(updateOpts);
  };

  const formatGamePopularityInfo = (
    numPlayers: number,
    maxAttendance: number,
    minAttendance: number
  ): string => {
    const count: number = minAttendance - numPlayers;
    let popularityInfo: string = t("signup.playerNeeded", { COUNT: count });
    if (numPlayers > minAttendance && numPlayers < maxAttendance) {
      popularityInfo = t("medium-popularity");
    } else if (numPlayers >= maxAttendance) {
      popularityInfo = t("high-popularity");
    }
    return popularityInfo;
  };

  return (
    <GameContainer key={game.gameId} data-testid="game-container">
      <GameHeader>
        <HeaderContainer>
          <h3 data-testid="game-title">{game.title}</h3>
          <p>
            <RowItem>
              {t("signup.expectedDuration", {
                EXPECTED_DURATION: formatDuration(game.mins),
              })}
            </RowItem>

            <RowItem>
              {game.minAttendance === game.maxAttendance
                ? t("signup.playerCount", {
                    MAX_ATTENDANCE: game.maxAttendance,
                  })
                : t("signup.playerRange", {
                    MIN_ATTENDANCE: game.minAttendance,
                    MAX_ATTENDANCE: game.maxAttendance,
                  })}
            </RowItem>
          </p>
          <PlayerCount visible={isEnterGameMode}>
            {t("signup.signupCount", {
              PLAYERS: game.popularity - game.maxAttendance,
              MAX_ATTENDANCE: game.maxAttendance,
            })}
          </PlayerCount>
          <GamePopularityContainer>
            <PopularityCircle
              color={formatPopularityCircleColor(
                players,
                game.maxAttendance,
                game.minAttendance
              )}
            />{" "} {game.popularity} {" " + game.minAttendance + " " + players}
            {formatGamePopularityInfo(
              game.popularity,
              game.maxAttendance,
              game.minAttendance
            )}
          </GamePopularityContainer>
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
              buttonStyle={ButtonStyle.NORMAL}
              data-testid={"remove-favorite-button"}
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
              buttonStyle={ButtonStyle.NORMAL}
              data-testid={"add-favorite-button"}
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
        <AlgorithmSignupForm
          game={game}
          startTime={startTime}
          signedGames={signedGames}
        />
      )}
    </GameContainer>
  );
};

/* const PlayersNeeded = styled("span")<{ visible: boolean }>`
  margin-top: 8px;
  display: ${(props) => (props.visible ? "block" : "none")};
`; */

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
  background: ${(props) => props.theme.backgroundTag};
  padding: 4px;
  margin-bottom: 4px;
  font-size: 12px;
  color: ${(props) => props.theme.textTag};
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
  color: ${(props) => props.theme.iconFavorited};
`;

const RowItem = styled.span`
  padding-right: 12px;
`;

const GamePopularityContainer = styled.div`
  display: flex;
  flex-direction: row;
  padding-top: 15px;
`;

const PopularityCircle = styled("div")<{ color: string }>`
  display: flex;
  height: 10px;
  width: 10px;
  background-color: ${(props) => props.theme[props.color]};
  border: none;
  border-radius: 50%;
  margin-top: 5px;
  margin-right: 5px;
`;
