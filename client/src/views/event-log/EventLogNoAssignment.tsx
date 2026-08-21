import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { EventLogItem } from "shared/types/models/eventLog";
import { getTime } from "shared/utils/timeFormatter";
import { useLocale } from "client/utils/useLocale";

interface Props {
  eventLogItem: EventLogItem;
}
export const EventLogNoAssignment = ({ eventLogItem }: Props): ReactElement => {
  const { t } = useTranslation();
  const locale = useLocale();

  return (
    <div>
      <span>
        {t("eventLogActions.noAssignment", {
          START_TIME: getTime(eventLogItem.programItemStartTime, locale),
        })}
      </span>
    </div>
  );
};
