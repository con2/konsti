import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { EventLogItem } from "shared/types/models/eventLog";
import { useAppSelector } from "client/utils/hooks";
import { getShortWeekdayAndTime } from "client/utils/timeFormatter";
import { AppRoute } from "client/app/AppRoutes";

interface Props {
  eventLogItem: EventLogItem;
}
export const EventLogProgramItemMoved = ({
  eventLogItem,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const programItems = useAppSelector(
    (state) => state.allProgramItems.programItems,
  );

  const programItem = programItems.find(
    (p) => p.programItemId === eventLogItem.programItemId,
  );

  return (
    <div>
      <span>
        {t(`programTypeGenetive.${programItem?.programType ?? "other"}`)}{" "}
        {programItem ? (
          <Link to={`${AppRoute.PROGRAM_ITEM}/${eventLogItem.programItemId}`}>
            {programItem.title}
          </Link>
        ) : (
          eventLogItem.programItemId
        )}{" "}
        {t("eventLogActions.programItemMoved", {
          NEW_STARTING_TIME: getShortWeekdayAndTime(
            eventLogItem.programItemStartTime,
          ),
        })}
      </span>
    </div>
  );
};
