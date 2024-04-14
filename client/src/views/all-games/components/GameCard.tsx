import { ReactElement } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { capitalize } from "lodash-es";
import { Game } from "shared/types/models/game";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { SelectedGame, UserGroup } from "shared/types/models/user";
import { RaisedCard } from "client/components/RaisedCard";
import {
  isAlreadyEntered,
  isAlreadySigned,
} from "client/views/all-games/components/allGamesUtils";
import { config } from "shared/config";
import { Tags } from "client/components/Tags";
import { formatGameDuration } from "client/utils/timeFormatter";
import { getAttendeeType } from "client/utils/getAttendeeType";
import { isRevolvingDoorWorkshop } from "client/utils/isRevolvingDoorWorkshop";
import { PopularityInfo } from "client/components/PopularityInfo";
import { FavoriteButton } from "client/components/FavoriteButton";
import { useAppDispatch } from "client/utils/hooks";
import { updateFavorite, UpdateFavoriteOpts } from "client/utils/favorite";
import { GameDetailsView } from "client/views/all-games/components/GameDetailsView";
import { SignupInfo } from "client/views/all-games/components/SignupInfo";

interface Props {
  game: Game;
  startTime: string;
  players: number;
  signupStrategy: SignupStrategy;
  signedGames: readonly SelectedGame[];
  enteredGames: readonly SelectedGame[];
  isAlwaysExpanded: boolean;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  username: string;
  loggedIn: boolean;
  userGroup: UserGroup;
  favoritedGames: readonly Game[];
}

export const GameCard = ({
  game,
  startTime,
  players,
  signupStrategy,
  signedGames,
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
  const dispatch = useAppDispatch();

  const signupAlwaysOpen = config
    .shared()
    .directSignupAlwaysOpenIds.includes(game.gameId);

  const requiresSignup = !isRevolvingDoorWorkshop(game);
  const konstiSignup = !config.shared().noKonstiSignupIds.includes(game.gameId);
  const normalSignup = requiresSignup && konstiSignup;

  const isEnterGameMode =
    config.shared().manualSignupMode === SignupStrategy.DIRECT ||
    signupStrategy === SignupStrategy.DIRECT ||
    signupAlwaysOpen;

  const isFavorited =
    favoritedGames.find(
      (favoritedGame) => favoritedGame.gameId === game.gameId,
    ) !== undefined;

  const isEnteredCurrentGame = isAlreadyEntered(game, enteredGames);
  const isSignedForCurrentGame = isAlreadySigned(game, signedGames);

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

  const updateFavoriteHandler = async (
    updateOpts: UpdateFavoriteOpts,
  ): Promise<void> => {
    if (!updateOpts.game.gameId) {
      return;
    }
    await updateFavorite(updateOpts);
  };

  return (
    <StyledCard isHighlighted={isGameSigned} data-testid="game-container">
      <>
        <HeaderRow>
          <H3 data-testid="game-title">
            <HeaderLink to={`/games/${game.gameId}`}>{game.title}</HeaderLink>
          </H3>
          {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
          {loggedIn && userGroup === "user" && game && (
            <FavoriteButton
              isFavorite={isFavorited}
              onClick={async () =>
                await updateFavoriteHandler({
                  game,
                  action: isFavorited ? "del" : "add",
                  favoritedGames,
                  username,
                  dispatch,
                })
              }
            />
          )}
        </HeaderRow>
        <Tags tags={tags} />
        <Row>
          {t("signup.expectedDuration", {
            EXPECTED_DURATION: formatGameDuration(game.mins),
          })}

          {requiresSignup &&
            game.minAttendance > 0 &&
            game.maxAttendance > 0 && (
              <>
                {game.minAttendance === game.maxAttendance &&
                  capitalize(
                    `${t(
                      `attendeeTypePlural.${getAttendeeType(game.programType)}`,
                    )} ${game.maxAttendance}`,
                  )}

                {game.minAttendance !== game.maxAttendance &&
                  capitalize(
                    `${t(
                      `attendeeTypePlural.${getAttendeeType(game.programType)}`,
                    )} ${game.minAttendance}–${game.maxAttendance}`,
                  )}
              </>
            )}
          {!!game.entryFee &&
            t(`signup.entryFee`, {
              ENTRY_FEE: game.entryFee,
            })}
        </Row>
        {isEnterGameMode && normalSignup && (
          <Row>
            {t("signup.signupCount", {
              PLAYERS: players,
              MAX_ATTENDANCE: game.maxAttendance,
            })}
          </Row>
        )}
        {players < game.minAttendance && (
          <Row>
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
          </Row>
        )}
        {!isEnterGameMode && normalSignup && (
          <PopularityInfo
            minAttendance={game.minAttendance}
            maxAttendance={game.maxAttendance}
            popularity={game.popularity}
            includeMsg={true}
          />
        )}
      </>
      <GameDetailsView game={game} isAlwaysExpanded={isAlwaysExpanded} />
      <SignupInfo game={game} />
    </StyledCard>
  );
};

const StyledCard = styled(RaisedCard)`
  display: flex;
  flex-direction: column;
`;

const H3 = styled.h3`
  margin: 8px 0 4px 0;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  margin-top: 12px;
`;

const HeaderRow = styled(Row)`
  margin-bottom: -12px;
  margin-top: 0;
  justify-content: space-between;
`;

const HeaderLink = styled(Link)`
  color: inherit;
  text-decoration: inherit;
`;
