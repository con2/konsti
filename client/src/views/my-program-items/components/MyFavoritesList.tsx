import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { sortBy } from "lodash-es";
import styled from "styled-components";
import { getStartTimes } from "client/utils/getStartTimes";
import { FavoritesByStartTimes } from "./FavoritesByStartTimes";
import { ProgramItem } from "shared/types/models/programItem";
import { RaisedCard } from "client/components/RaisedCard";
import {
  MyProgramHeader,
  MyProgramSecondaryText,
} from "client/views/my-program-items/components/shared";

interface Props {
  favoriteProgramItems: readonly ProgramItem[];
}

export const MyFavoritesList = ({
  favoriteProgramItems,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const sortedProgramItems: readonly ProgramItem[] = sortBy(
    favoriteProgramItems,
    [
      (favoriteProgramItem) => favoriteProgramItem.startTime,
      (favoriteProgramItem) => favoriteProgramItem.title.toLowerCase(),
    ],
  );

  const startTimes = getStartTimes(favoriteProgramItems);

  return (
    <RaisedCard>
      <MyProgramHeader>{t("favoriteProgramItems")}</MyProgramHeader>
      <div>
        {favoriteProgramItems.length === 0 && (
          <MyProgramSecondaryText>
            {t("noFavoriteProgramItems")}
          </MyProgramSecondaryText>
        )}
        {favoriteProgramItems.length !== 0 && (
          <FavoritesByStartTimes
            programItems={sortedProgramItems}
            startTimes={startTimes}
          />
        )}
      </div>
    </RaisedCard>
  );
};
