import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { sortBy } from "remeda";
import { ProgramItem } from "shared/types/models/programItem";
import { AppRoute } from "client/app/routes";
import { useTimeFormatters } from "client/utils/useTimeFormatters";

interface Props {
  hiddenProgramItems: readonly ProgramItem[];
}

export const HiddenProgramItemsList = ({
  hiddenProgramItems,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const { getWeekdayAndTime } = useTimeFormatters();

  const sortedProgramItems = sortBy(hiddenProgramItems, (hiddenProgramItem) =>
    hiddenProgramItem.title.toLowerCase(),
  );

  return (
    <div>
      <h3>{t("hiddenProgramItems")}</h3>

      <ul>
        {hiddenProgramItems.length === 0 && (
          <span>{t("noHiddenProgramItems")}</span>
        )}

        {sortedProgramItems.map((programItem) => (
          <li key={programItem.programItemId}>
            <Link to={`${AppRoute.PROGRAM_ITEM}/${programItem.programItemId}`}>
              {programItem.title}
            </Link>

            {" - "}
            {t(`programType.${programItem.programType}`)}
            {" - "}

            {getWeekdayAndTime(programItem.startTime)}
          </li>
        ))}
      </ul>
    </div>
  );
};
