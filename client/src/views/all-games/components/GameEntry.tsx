import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { updateFavorite, UpdateFavoriteOpts } from "client/utils/favorite";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { Game, Tag } from "shared/typings/models/game";
import { AlgorithmSignupForm } from "./AlgorithmSignupForm";
import { DirectSignupForm } from "./DirectSignupForm";
import { Button, ButtonStyle } from "client/components/Button";
import { SelectedGame } from "shared/typings/models/user";
import { isAlreadyEntered, isAlreadySigned } from "./allGamesUtils";
import { PopularityInfo } from "client/components/PopularityInfo";
import { sharedConfig } from "shared/config/sharedConfig";

const DESCRIPTION_SENTENCES_LENGTH = 3;
const matchNextSentence = /([.?!])\s*(?=[A-Z])/g;

interface Props {
  game: Game;
  startTime: string;
  players: number;
  signupStrategy: SignupStrategy;
  signedGames: readonly SelectedGame[];
  enteredGames: readonly SelectedGame[];
}

export const GameEntry = ({
  game,
  startTime,
  players,
  signupStrategy,
  signedGames,
  enteredGames,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const username = useAppSelector((state) => state.login.username);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const userGroup = useAppSelector((state) => state.login.userGroup);
  const favoritedGames = useAppSelector(
    (state) => state.myGames.favoritedGames
  );
  const isEnteredCurrentGame = isAlreadyEntered(game, enteredGames);
  const isSignedForCurrentGame = isAlreadySigned(game, signedGames);

  const dispatch = useAppDispatch();

  const signupAlwaysOpen = sharedConfig.directSignupAlwaysOpen.includes(
    game.gameId
  );

  const favorited =
    favoritedGames.find(
      (favoritedGame) => favoritedGame.gameId === game.gameId
    ) !== undefined;

  const isEnterGameMode =
    signupStrategy === SignupStrategy.DIRECT || signupAlwaysOpen;
  const gameIsFull = game.maxAttendance === players;

  const formatDuration = (mins: number): string => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;

    const hoursStr = hours === 0 ? "" : `${hours}h`;
    const minutesStr = minutes === 0 ? "" : `${minutes}min`;

    return `${hoursStr} ${minutesStr}`;
  };

  const updateFavoriteHandler = async (
    updateOpts: UpdateFavoriteOpts
  ): Promise<void> => {
    if (!updateOpts?.game || !updateOpts?.game?.gameId) return;
    await updateFavorite(updateOpts);
  };

  const isGameSigned = isEnterGameMode
    ? isEnteredCurrentGame
    : isSignedForCurrentGame;

  return (
    <GameContainer
      key={game.gameId}
      signed={isGameSigned}
      data-testid="game-container"
    >
      <GameHeader>
        <HeaderContainer>
          <h3 data-testid="game-title">{game.title}</h3>
          {signupAlwaysOpen && (
            <SignupAlwaysOpenHelp>
              {t("signup.signupAlwaysOpen")}
            </SignupAlwaysOpenHelp>
          )}
          <GameTags>
            <TagColumn>
              <GameTag>{t(`programType.${game.programType}`)}</GameTag>
              {game.gameSystem && <GameTag>{game.gameSystem}</GameTag>}
              {game.tags.includes(Tag.IN_ENGLISH) && (
                <GameTag>{t("gameTags.inEnglish")}</GameTag>
              )}
            </TagColumn>
          </GameTags>
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
          {isEnterGameMode && (
            <>
              <PlayerCount>
                {t("signup.signupCount", {
                  PLAYERS: players,
                  MAX_ATTENDANCE: game.maxAttendance,
                })}
              </PlayerCount>
              <PlayersNeeded visible={players < game.minAttendance}>
                {t("signup.playerNeeded", {
                  COUNT: game.minAttendance - players,
                })}
              </PlayersNeeded>
            </>
          )}
          {!isEnterGameMode && (
            <PopularityInfo
              minAttendance={game.minAttendance}
              maxAttendance={game.maxAttendance}
              popularity={game.popularity}
              includeMsg={true}
            />
          )}
        </HeaderContainer>
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
            aria-label={t("iconAltText.deleteFavorite")}
          >
            <FavoriteIcon icon="heart" aria-hidden="true" />
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
            aria-label={t("iconAltText.addFavorite")}
          >
            <FavoriteIcon icon={["far", "heart"]} aria-hidden="true" />
          </FavoriteButton>
        )}
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

const PlayersNeeded = styled("span")<{ visible: boolean }>`
  margin-top: 8px;
  margin-bottom: 14px;
  display: ${(props) => (props.visible ? "block" : "none")};
`;

const PlayerCount = styled("span")`
  margin-top: 8px;
`;

const FavoriteButton = styled(Button)`
  margin: 0 0 0 16px;
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

const GameTag = styled.span`
  display: flex;
  align-items: center;
  text-align: center;
  background: ${(props) => props.theme.backgroundTag};
  padding: 4px 8px;
  margin-bottom: 4px;
  font-size: 12px;
  color: ${(props) => props.theme.textTag};
  margin-left: 8px;

  &:first-child {
    margin-left: 0;
  }
`;

const TagColumn = styled.div`
  display: flex;
  margin-top: 4px;
`;

const GameMoreInfoRow = styled(GameEntryRow)`
  justify-content: space-between;
  align-items: center;
`;

const GameContainer = styled.div<{ signed: boolean }>`
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

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    margin-left: 0;
    margin-right: 0;
  }

  ${(props) => props.signed && `border: 1px solid ${props.theme.infoBorder};`}
  ${(props) =>
    props.signed && `border-left: 5px solid ${props.theme.infoBorder};`}
`;

const GameListShortDescription = styled.div`
  font-size: ${(props) => props.theme.fontSizeSmall};
  font-style: italic;
  margin-bottom: 14px;
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

const SignupAlwaysOpenHelp = styled.span`
  font-weight: 600;
  margin-top: 10px;
`;
