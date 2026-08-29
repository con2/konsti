import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { capitalize } from "remeda";
import { EventLogItem } from "shared/types/models/eventLog";
import { useTimeFormatters } from "client/utils/useTimeFormatters";

interface Props {
  eventLogItem: EventLogItem;
}
export const EventLogNoAssignment = ({ eventLogItem }: Props): ReactElement => {
  const { t } = useTranslation();
  const { getTime } = useTimeFormatters();

  // A lottery covering several starting times names the whole span, since no single hour of it
  // is the one the attendee was competing for
  const { lotteriedUntil, programType } = eventLogItem;

  return (
    <div>
      <span>
        {lotteriedUntil && programType
          ? t("eventLogActions.noAssignmentTimeRange", {
              PROGRAM_TYPE: capitalize(t(`programTypePlural.${programType}`)),
              FIRST_TIME: getTime(eventLogItem.programItemStartTime),
              LAST_TIME: getTime(lotteriedUntil),
            })
          : t("eventLogActions.noAssignment", {
              START_TIME: getTime(eventLogItem.programItemStartTime),
            })}
      </span>
    </div>
  );
};
