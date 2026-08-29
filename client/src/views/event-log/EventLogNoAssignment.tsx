import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { capitalize } from "remeda";
import { EventLogItem } from "shared/types/models/eventLog";
import { useTimeFormatters } from "client/utils/useTimeFormatters";
import { isSameDayInEventTimezone } from "client/views/program-item/programItemUtils";

interface Props {
  eventLogItem: EventLogItem;
}
export const EventLogNoAssignment = ({ eventLogItem }: Props): ReactElement => {
  const { t } = useTranslation();
  const { getTime, getShortWeekdayAndTime } = useTimeFormatters();

  // A lottery covering several starting times names the whole span, since no single hour of it
  // is the one the attendee was competing for
  const { programItemStartTime, lotteriedUntil, programType } = eventLogItem;

  // A span can end on the next day, where bare clock times read as running backwards. Both ends
  // carry the day then, so neither of them is the one the reader has to guess
  const spanCrossesDay =
    !!lotteriedUntil &&
    !isSameDayInEventTimezone(
      new Date(programItemStartTime),
      new Date(lotteriedUntil),
    );
  const formatSpanTime = spanCrossesDay ? getShortWeekdayAndTime : getTime;

  return (
    <div>
      <span>
        {lotteriedUntil && programType
          ? t("eventLogActions.noAssignmentTimeRange", {
              PROGRAM_TYPE: capitalize(t(`programTypePlural.${programType}`)),
              FIRST_TIME: formatSpanTime(programItemStartTime),
              LAST_TIME: formatSpanTime(lotteriedUntil),
            })
          : t("eventLogActions.noAssignment", {
              START_TIME: getTime(programItemStartTime),
            })}
      </span>
    </div>
  );
};
