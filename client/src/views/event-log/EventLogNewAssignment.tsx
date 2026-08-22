import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import styled from "styled-components";
import { config } from "shared/config";
import { RemoveLotterySignupsStrategy } from "shared/config/eventConfigTypes";
import { EventLogItem } from "shared/types/models/eventLog";
import { ProgramItem } from "shared/types/models/programItem";
import { AppRoute } from "client/app/routes";
import { useTimeFormatters } from "client/utils/useTimeFormatters";

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
  const { getWeekdayAndTime } = useTimeFormatters();

  const foundProgramItem = programItems.find(
    (programItem) => programItem.programItemId === eventLogItem.programItemId,
  );

  return (
    <div>
      {!foundProgramItem && (
        <span>
          {t("eventLogActions.newAssignmentProgramItemMissing", {
            PROGRAM_ITEM_ID: eventLogItem.programItemId,
          })}
        </span>
      )}

      {foundProgramItem && (
        <>
          <span>
            {t("eventLogActions.newAssignment", {
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
            <>
              <TextRow>
                {t("eventLog.programItemDetails", {
                  START_TIME: getWeekdayAndTime(foundProgramItem.startTime),
                  LOCATION: foundProgramItem.location,
                })}
              </TextRow>
              {config.event().removeLotterySignupsStrategy ===
                RemoveLotterySignupsStrategy.OVERLAP && (
                <TextRow>{t("eventLog.overlapLotterySignupsRemoved")}</TextRow>
              )}
              {config.event().removeLotterySignupsStrategy ===
                RemoveLotterySignupsStrategy.ALL_UPCOMING && (
                <TextRow>{t("eventLog.upcomingLotterySignupsRemoved")}</TextRow>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

const TextRow = styled.div`
  margin: 8px 0 0 0;
`;

const StyledLink = styled(Link)`
  margin: 8px 0 0 0;
`;
