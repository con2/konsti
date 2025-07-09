import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { capitalize } from "remeda";
import { EventLogItem } from "shared/types/models/eventLog";
import { useAppSelector } from "client/utils/hooks";
import { AppRoute } from "client/app/AppRoutes";

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
        })}{" "}
        {programItem ? (
          <Link to={`${AppRoute.PROGRAM_ITEM}/${eventLogItem.programItemId}`}>
            {programItem.title}
          </Link>
        ) : (
          eventLogItem.programItemId
        )}
      </span>
    </div>
  );
};
