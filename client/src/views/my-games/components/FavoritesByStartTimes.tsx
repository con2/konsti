import { Fragment, ReactElement } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { capitalize } from "lodash-es";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { ProgramItem } from "shared/types/models/programItem";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { updateFavorite } from "client/utils/favorite";
import { IconButton } from "client/components/IconButton";
import { selectFavoritedGames } from "client/views/my-games/myGamesSlice";

interface Props {
  games: readonly ProgramItem[];
  startTimes: readonly string[];
}

export const FavoritesByStartTimes = ({
  games,
  startTimes,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.login.username);
  const favoritedGames = useAppSelector(selectFavoritedGames);

  const removeFavorite = async (game: ProgramItem): Promise<void> => {
    await updateFavorite({
      game,
      action: "del",
      favoritedGames,
      username,
      dispatch,
    });
  };

  return (
    <>
      {startTimes.map((startTime) => {
        return (
          <Fragment key={startTime}>
            <StyledTime>{capitalize(getWeekdayAndTime(startTime))}</StyledTime>

            <ul>
              {games.map((game) => {
                if (game.startTime === startTime) {
                  return (
                    <ProgramItemDetailsRow key={game.programItemId}>
                      <StyledLink
                        to={`/games/${game.programItemId}`}
                        data-testid={"game-title"}
                      >
                        {game.title}
                      </StyledLink>
                      <IconButton
                        icon="heart-circle-xmark"
                        onClick={async () => {
                          await removeFavorite(game);
                        }}
                        ariaLabel={t("iconAltText.deleteFavorite")}
                      />
                    </ProgramItemDetailsRow>
                  );
                }
              })}
            </ul>
          </Fragment>
        );
      })}
    </>
  );
};

const ProgramItemDetailsRow = styled.li`
  align-items: center;
  justify-content: left;
  margin-bottom: 8px;
  list-style: none;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    justify-content: space-between;
  }
`;

const StyledTime = styled.p`
  font-weight: 600;
  margin: 10px 0;
`;

const StyledLink = styled(Link)`
  margin-right: 8px;
`;
