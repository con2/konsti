import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { sortBy } from "lodash-es";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { Game } from "shared/types/models/game";

interface Props {
  hiddenGames: readonly Game[];
}

export const HiddenGamesList = ({ hiddenGames }: Props): ReactElement => {
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
          <li key={game.gameId}>
            <Link to={`/games/${game.gameId}`}>{game.title}</Link>

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
