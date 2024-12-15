import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link } from "react-router";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { AppRoute } from "client/app/AppRoutes";
import { ProgramItem } from "shared/types/models/programItem";
import { EventLogItem } from "shared/types/models/eventLog";

interface Props {
  eventLogItem: EventLogItem;
  programItems: readonly ProgramItem[];
  showDetails: boolean;
}
export const EventLogNewAssignment = ({
  eventLogItem,
  programItems,
  showDetails,
}: Props): ReactElement | null => {
  const { t } = useTranslation();

  const foundProgramItem = programItems.find(
    (programItem) => programItem.programItemId === eventLogItem.programItemId,
  );

  return (
    <div>
      {!foundProgramItem && (
        <span>
          {t(`eventLogActions.newAssignmentProgramItemMissing`, {
            PROGRAM_ITEM_ID: eventLogItem.programItemId,
          })}
        </span>
      )}

      {foundProgramItem && (
        <>
          <span>
            {t(`eventLogActions.newAssignment`, {
              PROGRAM_TYPE: t(
                `programTypeIllative.${foundProgramItem.programType}`,
              ),
            })}{" "}
            <StyledLink
              to={`${AppRoute.PROGRAM_ITEM}/${eventLogItem.programItemId}`}
            >
              {foundProgramItem.title}
            </StyledLink>
            .
          </span>

          {showDetails && (
            <StartTime>
              {t("eventLog.programItemDetails", {
                START_TIME: getWeekdayAndTime(foundProgramItem.startTime),
                LOCATION: foundProgramItem.location,
              })}
            </StartTime>
          )}
        </>
      )}
    </div>
  );
};

const StartTime = styled.div`
  margin: 8px 0 0 0;
`;

const StyledLink = styled(Link)`
  margin: 8px 0 0 0;
`;
