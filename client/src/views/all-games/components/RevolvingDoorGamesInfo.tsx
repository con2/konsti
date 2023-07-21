import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { getTimeNow } from "client/utils/getTimeNow";
import { useAppSelector } from "client/utils/hooks";
import { selectActiveGames } from "client/views/admin/adminSlice";

export const RevolvingDoorGamesInfo = (): ReactElement => {
  const { t } = useTranslation();

  const activeGames = useAppSelector(selectActiveGames);
  const hiddenGames = useAppSelector((state) => state.admin.hiddenGames);
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType
  );

  const hiddenGamesIds = hiddenGames.map((g) => g.gameId);

  const timeNow = getTimeNow();
  const runningRevolvingDoorGames = activeGames.filter((game) => {
    return (
      game.revolvingDoor &&
      !hiddenGamesIds.includes(game.gameId) &&
      dayjs(game.startTime).isBefore(timeNow) &&
      dayjs(game.endTime).isAfter(timeNow)
    );
  });

  return (
    <Container>
      <RevolvingDoorInstruction>
        {t("revolvingDoorInstruction", {
          PROGRAM_TYPE: t(`programTypeIllative.${activeProgramType}`),
          PROGRAM_TYPE2: t(`programTypeInessive.${activeProgramType}`),
        })}
      </RevolvingDoorInstruction>
      {!runningRevolvingDoorGames || runningRevolvingDoorGames.length === 0 ? (
        <NoGamesInfoText>
          {t("noCurrentlyRunningGames", {
            PROGRAM_TYPE: t(`programTypePartitivePlural.${activeProgramType}`),
          })}
        </NoGamesInfoText>
      ) : (
        <div>
          <h3>
            {t("currentlyRunningRevolvingDoor", {
              PROGRAM_TYPE: t(`programTypePlural.${activeProgramType}`),
            })}
          </h3>
          {runningRevolvingDoorGames.map((game) => (
            <div key={game.gameId}>
              <Link to={`/games/${game.gameId}`}>{game.title}</Link>{" "}
              <GameListShortDescription>
                {game.shortDescription
                  ? game.shortDescription
                  : game.gameSystem}
              </GameListShortDescription>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
};

const GameListShortDescription = styled.p`
  font-size: ${(props) => props.theme.fontSizeSmall};
  margin: 4px 0 8px 8px;
`;

const Container = styled.div`
  display: grid;
  background: #fafafa;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    margin-left: 0;
    margin-right: 0;
  }
`;

const RevolvingDoorInstruction = styled.div`
  margin: 8px 0 16px 0;
  border: 1px solid ${(props) => props.theme.infoBorder};
  padding: 8px 6px;
  border-radius: 5px;
  border-left: 5px solid ${(props) => props.theme.infoBorder};
  background-color: ${(props) => props.theme.infoBackground};
`;

const NoGamesInfoText = styled.span`
  margin-bottom: 8px;
`;
