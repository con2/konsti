import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Link } from "react-router";
import styled from "styled-components";
import { sortBy } from "remeda";
import { getTimeNow } from "client/utils/getTimeNow";
import { useAppSelector } from "client/utils/hooks";
import {
  selectActiveProgramItems,
  selectHiddenProgramItems,
} from "client/views/admin/adminSlice";
import { AppRoute } from "client/app/AppRoutes";
import { InfoText } from "client/components/InfoText";

export const RevolvingDoorProgramItemsInfo = (): ReactElement => {
  const { t } = useTranslation();

  const activeProgramItems = useAppSelector(selectActiveProgramItems);
  const hiddenProgramItems = useAppSelector(selectHiddenProgramItems);
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType,
  );

  const hiddenProgramItemsIds = new Set(
    hiddenProgramItems.map((p) => p.programItemId),
  );

  const timeNow = getTimeNow();
  const runningRevolvingDoorProgramItems = sortBy(
    activeProgramItems.filter((programItem) => {
      return (
        programItem.revolvingDoor &&
        !hiddenProgramItemsIds.has(programItem.programItemId) &&
        dayjs(programItem.startTime).isBefore(timeNow) &&
        dayjs(programItem.endTime).isAfter(timeNow)
      );
    }),
    (programItem) => programItem.title,
  );

  return (
    <Container>
      <InfoText>
        {t("revolvingDoorInstruction", {
          PROGRAM_TYPE: t(`programTypeIllative.${activeProgramType}`),
          PROGRAM_TYPE2: t(`programTypeInessive.${activeProgramType}`),
        })}
      </InfoText>
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
          {runningRevolvingDoorProgramItems.map((programItem) => (
            <div key={programItem.programItemId}>
              <Link
                to={`${AppRoute.PROGRAM_ITEM}/${programItem.programItemId}`}
              >
                {programItem.title}
              </Link>{" "}
              <ProgramItemListShortDescription>
                {programItem.shortDescription}
              </ProgramItemListShortDescription>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
};

const ProgramItemListShortDescription = styled.p`
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

const NoProgramItemsInfoText = styled.span`
  margin-bottom: 8px;
`;
