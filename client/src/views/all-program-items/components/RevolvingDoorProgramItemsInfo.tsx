import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { getTimeNow } from "client/utils/getTimeNow";
import { useAppSelector } from "client/utils/hooks";
import { selectActiveProgramItems } from "client/views/admin/adminSlice";

export const RevolvingDoorProgramItemsInfo = (): ReactElement => {
  const { t } = useTranslation();

  const activeProgramItems = useAppSelector(selectActiveProgramItems);
  const hiddenProgramItems = useAppSelector(
    (state) => state.admin.hiddenProgramItems,
  );
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType,
  );

  const hiddenProgramItemsIds = hiddenProgramItems.map((g) => g.programItemId);

  const timeNow = getTimeNow();
  const runningRevolvingDoorProgramItems = activeProgramItems.filter((game) => {
    return (
      game.revolvingDoor &&
      !hiddenProgramItemsIds.includes(game.programItemId) &&
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
      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
      {!runningRevolvingDoorProgramItems ||
      runningRevolvingDoorProgramItems.length === 0 ? (
        <NoProgramItemsInfoText>
          {t("noRunningRevolvingDoorProgramItems", {
            PROGRAM_TYPE: t(`programTypePartitivePlural.${activeProgramType}`),
          })}
        </NoProgramItemsInfoText>
      ) : (
        <div>
          <h3>
            {t("currentlyRunningRevolvingDoor", {
              PROGRAM_TYPE: t(`programTypePlural.${activeProgramType}`),
            })}
          </h3>
          {runningRevolvingDoorProgramItems.map((game) => (
            <div key={game.programItemId}>
              <Link to={`/program/${game.programItemId}`}>{game.title}</Link>{" "}
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

const NoProgramItemsInfoText = styled.span`
  margin-bottom: 8px;
`;
