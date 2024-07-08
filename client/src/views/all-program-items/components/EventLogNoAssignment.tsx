import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { EventLogItem } from "shared/types/models/eventLog";
import { getTime } from "client/utils/timeFormatter";

interface Props {
  eventLogItem: EventLogItem;
}
export const EventLogNoAssignment = ({ eventLogItem }: Props): ReactElement => {
  const { t } = useTranslation();

  return (
    <div>
      <span>
        {t(`eventLogActions.noAssignment`, {
          START_TIME: getTime(eventLogItem.programItemStartTime),
        })}
        .
      </span>
    </div>
  );
};
