import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { sortBy } from "lodash-es";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { ProgramItem } from "shared/types/models/programItem";

interface Props {
  hiddenProgramItems: readonly ProgramItem[];
}

export const HiddenProgramItemsList = ({
  hiddenProgramItems,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const sortedProgramItems = sortBy(hiddenProgramItems, [
    (hiddenGame) => hiddenGame.title.toLowerCase(),
  ]);

  return (
    <div>
      <h3>{t("hiddenProgramItems")}</h3>

      <ul>
        {hiddenProgramItems.length === 0 && (
          <span>{t("noHiddenProgramItems")}</span>
        )}

        {sortedProgramItems.map((programItem) => (
          <li key={programItem.programItemId}>
            <Link to={`/games/${programItem.programItemId}`}>
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
