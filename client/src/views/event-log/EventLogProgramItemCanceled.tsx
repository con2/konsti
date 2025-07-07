import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { capitalize } from "remeda";
import { EventLogItem } from "shared/types/models/eventLog";
import { useAppSelector } from "client/utils/hooks";

interface Props {
  eventLogItem: EventLogItem;
}
export const EventLogProgramItemCanceled = ({
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
        {t("eventLogActions.programItemCanceled", {
          PROGRAM_TYPE: capitalize(
            t(`programTypeSingular.${programItem?.programType ?? "other"}`),
          ),
          PROGRAM_ITEM_NAME: programItem?.title ?? eventLogItem.programItemId,
        })}
      </span>
    </div>
  );
};
