import { ReactElement } from "react";
import styled from "styled-components";
import { capitalize } from "lodash-es";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Game } from "shared/types/models/game";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { UserGroup } from "shared/types/models/user";
import { FavoriteButton } from "client/components/FavoriteButton";
import { Tags } from "client/components/Tags";
import { formatGameDuration } from "client/utils/timeFormatter";
import { getAttendeeType } from "client/utils/getAttendeeType";
import { PopularityInfo } from "client/components/PopularityInfo";
import { updateFavorite, UpdateFavoriteOpts } from "client/utils/favorite";
import { useAppDispatch } from "client/utils/hooks";
import { config } from "shared/config";
import { isRevolvingDoorWorkshop } from "client/utils/isRevolvingDoorWorkshop";

interface Props {
  game: Game;
  players: number;
  signupStrategy: SignupStrategy;
  username: string;
  loggedIn: boolean;
  userGroup: UserGroup;
  favoritedGames: readonly Game[];
}

export const GameHead = ({
  game,
  players,
  signupStrategy,
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
  const validMaxAttendanceValue = requiresSignup && game.maxAttendance > 0;

  const isEnterGameMode =
    config.shared().manualSignupMode === SignupStrategy.DIRECT ||
    signupStrategy === SignupStrategy.DIRECT ||
    signupAlwaysOpen;

  const isFavorited =
    favoritedGames.find(
      (favoritedGame) => favoritedGame.gameId === game.gameId,
    ) !== undefined;

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
    <Container>
      <div>
        <H3 data-testid="game-title">
          <HeaderLink to={`/games/${game.gameId}`}>{game.title}</HeaderLink>
        </H3>
        <Tags tags={tags} />
        <Row>
          <span>
            {t("signup.expectedDuration", {
              EXPECTED_DURATION: formatGameDuration(game.mins),
            })}
          </span>
          <span>
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
          </span>
          {!!game.entryFee &&
            t(`signup.entryFee`, {
              ENTRY_FEE: game.entryFee,
            })}
        </Row>
        {isEnterGameMode && normalSignup && validMaxAttendanceValue && (
          <Row>
            {t("signup.signupCount", {
              PLAYERS: players,
              MAX_ATTENDANCE: game.maxAttendance,
            })}
          </Row>
        )}

        {!validMaxAttendanceValue && (
          <ErrorText>
            {t("signup.maxAttendanceMissing", {
              ATTENDEE_TYPE: t(
                `attendeeTypePlural.${getAttendeeType(game.programType)}`,
              ),
            })}
          </ErrorText>
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
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
      {loggedIn && userGroup === "user" && game && (
        <FavoriteButtonContainer>
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
        </FavoriteButtonContainer>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const H3 = styled.h3`
  margin: 8px 0 4px 0;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  margin-top: 12px;
`;

const HeaderLink = styled(Link)`
  color: inherit;
  text-decoration: inherit;
`;

const FavoriteButtonContainer = styled.div`
  margin-top: -4px;
  align-items: flex-start;
`;

const ErrorText = styled(Row)`
  color: ${(props) => props.theme.textError};
`;
