import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { sortBy } from "lodash-es";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { ProgramItem } from "shared/types/models/programItem";

interface Props {
  hiddenGames: readonly ProgramItem[];
}

export const HiddenProgramItemsList = ({
  hiddenGames,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const sortedGames = sortBy(hiddenGames, [
    (hiddenGame) => hiddenGame.title.toLowerCase(),
  ]);

  return (
    <div>
      <h3>{t("hiddenProgramItems")}</h3>

      <ul>
        {hiddenGames.length === 0 && <span>{t("noHiddenProgramItems")}</span>}

        {sortedGames.map((game) => (
          <li key={game.programItemId}>
            <Link to={`/games/${game.programItemId}`}>{game.title}</Link>

            {" - "}
            {t(`programType.${game.programType}`)}
            {" - "}

            {getWeekdayAndTime(game.startTime)}
          </li>
        ))}
      </ul>
    </div>
  );
};
