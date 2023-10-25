import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link } from "react-router-dom";
import _ from "lodash";
import { updateFavorite, UpdateFavoriteOpts } from "client/utils/favorite";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { Game } from "shared/typings/models/game";
import { AlgorithmSignupForm } from "./AlgorithmSignupForm";
import { DirectSignupForm } from "./DirectSignupForm";
import { SelectedGame } from "shared/typings/models/user";
import { isAlreadyEntered, isAlreadySigned } from "./allGamesUtils";
import { PopularityInfo } from "client/components/PopularityInfo";
import { config } from "shared/config/config";
import { GameDetailsView } from "client/views/all-games/components/GameDetailsView";
import { Tags } from "client/components/Tags";
import { FavoriteButton } from "client/components/FavoriteButton";
import { getAttendeeType } from "client/utils/getAttendeeType";
import { RaisedCard } from "client/components/RaisedCard";
import { isRevolvingDoorWorkshop } from "client/utils/isRevolvingDoorWorkshop";

interface Props {
  game: Game;
  startTime: string;
  players: number;
  signupStrategy: SignupStrategy;
  signedGames: readonly SelectedGame[];
  enteredGames: readonly SelectedGame[];
  isAlwaysExpanded: boolean;
}

export const GameEntry = ({
  game,
  startTime,
  players,
  signupStrategy,
  signedGames,
  enteredGames,
  isAlwaysExpanded,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const username = useAppSelector((state) => state.login.username);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const userGroup = useAppSelector((state) => state.login.userGroup);
  const favoritedGames = useAppSelector(
    (state) => state.myGames.favoritedGames,
  );
  const isEnteredCurrentGame = isAlreadyEntered(game, enteredGames);
  const isSignedForCurrentGame = isAlreadySigned(game, signedGames);

  const dispatch = useAppDispatch();

  const signupAlwaysOpen = config
    .shared()
    .directSignupAlwaysOpenIds.includes(game.gameId);

  const favorited =
    favoritedGames.find(
      (favoritedGame) => favoritedGame.gameId === game.gameId,
    ) !== undefined;

  const isEnterGameMode =
    config.shared().manualSignupMode === SignupStrategy.DIRECT ||
    signupStrategy === SignupStrategy.DIRECT ||
    signupAlwaysOpen;

  const gameIsFull = players >= game.maxAttendance;

  const formatDuration = (mins: number): string => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;

    const hoursStr = hours === 0 ? "" : `${hours} h`;
    const minutesStr = minutes === 0 ? "" : `${minutes} min`;

    return `${hoursStr} ${minutesStr}`;
  };

  const updateFavoriteHandler = async (
    updateOpts: UpdateFavoriteOpts,
  ): Promise<void> => {
    if (!updateOpts.game.gameId) {
      return;
    }
    await updateFavorite(updateOpts);
  };

  const isGameSigned = isEnterGameMode
    ? isEnteredCurrentGame
    : isSignedForCurrentGame;

  const tags = [];
  if (config.shared().activeProgramTypes.length > 1) {
    tags.push(t(`programType.${game.programType}`));
  }
  if (game.gameSystem) {
    tags.push(game.gameSystem);
  }
  tags.push(t(`programItemLanguage.${game.language}`));

  const requiresSignup = !isRevolvingDoorWorkshop(game);
  const konstiSignup = !config.shared().noKonstiSignupIds.includes(game.gameId);
  const normalSignup = requiresSignup && konstiSignup;

  return (
    <GameContainer
      key={game.gameId}
      isHighlighted={isGameSigned}
      data-testid="game-container"
    >
      <GameHeader>
        <HeaderContainer>
          <h3 data-testid="game-title">
            <StyledLink to={`/games/${game.gameId}`}>{game.title} </StyledLink>
          </h3>
          {signupAlwaysOpen && (
            <SignupAlwaysOpenHelp>
              {t("signup.signupAlwaysOpen")}
            </SignupAlwaysOpenHelp>
          )}
          <Tags tags={tags} />
          <p>
            <RowItem>
              {t("signup.expectedDuration", {
                EXPECTED_DURATION: formatDuration(game.mins),
              })}
            </RowItem>

            <RowItem>
              {requiresSignup &&
                game.minAttendance === game.maxAttendance &&
                _.capitalize(
                  `${t(
                    `attendeeTypePlural.${getAttendeeType(game.programType)}`,
                  )} ${game.maxAttendance}`,
                )}

              {requiresSignup &&
                game.minAttendance !== game.maxAttendance &&
                _.capitalize(
                  `${t(
                    `attendeeTypePlural.${getAttendeeType(game.programType)}`,
                  )} ${game.minAttendance}–${game.maxAttendance}`,
                )}
            </RowItem>

            <RowItem>
              {!!game.entryFee &&
                t(`signup.entryFee`, {
                  ENTRY_FEE: game.entryFee,
                })}
            </RowItem>
          </p>

          {isEnterGameMode && normalSignup && (
            <>
              <PlayerCount>
                {t("signup.signupCount", {
                  PLAYERS: players,
                  MAX_ATTENDANCE: game.maxAttendance,
                })}
              </PlayerCount>
              <PlayersNeeded $visible={players < game.minAttendance}>
                {t("signup.attendeesNeeded", {
                  COUNT: game.minAttendance - players,
                  ATTENDEE_TYPE:
                    game.minAttendance - players === 1
                      ? t(`attendeeType.${getAttendeeType(game.programType)}`)
                      : t(
                          `attendeeTypePartitive.${getAttendeeType(
                            game.programType,
                          )}`,
                        ),
                })}
              </PlayersNeeded>
            </>
          )}

          {!isEnterGameMode && normalSignup && (
            <PopularityInfo
              minAttendance={game.minAttendance}
              maxAttendance={game.maxAttendance}
              popularity={game.popularity}
              includeMsg={true}
            />
          )}
        </HeaderContainer>

        {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
        {loggedIn && userGroup === "user" && game && (
          <FavoriteButton
            isFavorite={favorited}
            onClick={async () =>
              await updateFavoriteHandler({
                game,
                action: favorited ? "del" : "add",
                favoritedGames,
                username,
                dispatch,
              })
            }
          />
        )}
      </GameHeader>

      <GameDetailsView game={game} isAlwaysExpanded={isAlwaysExpanded} />

      {!isEnterGameMode && normalSignup && (
        <AlgorithmSignupForm
          game={game}
          startTime={startTime}
          signedGames={signedGames}
        />
      )}

      {isEnterGameMode && normalSignup && (
        <DirectSignupForm
          game={game}
          gameIsFull={gameIsFull}
          startTime={startTime}
        />
      )}

      {!requiresSignup && (
        <p>
          {t("signup.doesNotRequireSignup", {
            PROGRAM_TYPE: t(`programTypeIllative.${game.programType}`),
          })}
        </p>
      )}

      {!konstiSignup && (
        <p>
          {t("signup.noKonstiSignup", {
            PROGRAM_TYPE: t(`programTypeIllative.${game.programType}`),
          })}
        </p>
      )}
    </GameContainer>
  );
};

const PlayersNeeded = styled("span")<{ $visible: boolean }>`
  margin-top: 8px;
  display: ${(props) => (props.$visible ? "block" : "none")};
`;

const PlayerCount = styled("span")`
  margin-top: 8px;
`;

const GameEntryRow = styled.div`
  display: flex;
  flex-direction: row;
`;

const GameHeader = styled(GameEntryRow)`
  justify-content: space-between;
  margin-bottom: 14px;
`;

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;

  h3 {
    margin: 8px 0 4px 0;
  }
`;

const GameContainer = styled(RaisedCard)`
  display: flex;
  flex-direction: column;
  min-height: 160px;
  color: rgb(61, 61, 61);

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    margin-left: 0;
    margin-right: 0;
  }
`;

const RowItem = styled.span`
  padding-right: 12px;
`;

const SignupAlwaysOpenHelp = styled.div`
  margin: 6px 0 6px 0;
  border: 1px solid ${(props) => props.theme.infoBorder};
  padding: 8px 6px;
  border-radius: 5px;
  border-left: 5px solid ${(props) => props.theme.infoBorder};
  background-color: ${(props) => props.theme.infoBackground};
`;

const StyledLink = styled(Link)`
  color: inherit;
  text-decoration: inherit;
`;
