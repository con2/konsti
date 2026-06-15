import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { capitalize } from "remeda";
import { EventLogAction, EventLogItem } from "shared/types/models/eventLog";
import { useAppSelector } from "client/utils/hooks";
import { AppRoute } from "client/app/AppRoutes";

interface Props {
  eventLogItem: EventLogItem;
}

export const EventLogProgramItemCancelled = ({
  eventLogItem,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const programItems = useAppSelector(
    (state) => state.allProgramItems.programItems,
  );

  const programItem = programItems.find(
    (p) => p.programItemId === eventLogItem.programItemId,
  );

  const programType = programItem?.programType ?? "other";
  const programTypeSingular = capitalize(
    t(`programTypeSingular.${programType}`),
  );
  const programTypeGenetive = capitalize(
    t(`programTypeGenetive.${programType}`),
  );

  const messageByAction: Partial<Record<EventLogAction, string>> = {
    [EventLogAction.PROGRAM_ITEM_CANCELLED]: t(
      "eventLogActions.programItemCancelled",
      { PROGRAM_TYPE: programTypeSingular },
    ),
    [EventLogAction.PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE]: t(
      "eventLogActions.programItemNoKonstiSignupAnymore",
      { PROGRAM_TYPE: programTypeGenetive },
    ),
    [EventLogAction.PROGRAM_ITEM_NO_LOTTERY_ANYMORE]: t(
      "eventLogActions.programItemNoLotteryAnymore",
      { PROGRAM_TYPE: programTypeSingular },
    ),
  };

  return (
    <div>
      <span>
        {messageByAction[eventLogItem.action]}{" "}
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
