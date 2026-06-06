import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { sortBy } from "remeda";
import { FavoritesByStartTimes } from "./FavoritesByStartTimes";
import { ProgramItem } from "shared/types/models/programItem";
import { RaisedCard } from "client/components/RaisedCard";
import {
  EmptyContentContainer,
  MyProgramHeader,
  MyProgramSecondaryText,
  ShowAllButton,
} from "client/views/my-program-items/components/shared";

interface Props {
  favoriteProgramItems: readonly ProgramItem[];
  showAllProgramItems: boolean;
  setShowAllProgramItems: (showAllProgramItems: boolean) => void;
}

export const MyFavoritesList = ({
  favoriteProgramItems,
  showAllProgramItems,
  setShowAllProgramItems,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const sortedFavoriteProgramItems: readonly ProgramItem[] = sortBy(
    favoriteProgramItems,
    (favoriteProgramItem) => favoriteProgramItem.startTime,
    (favoriteProgramItem) => favoriteProgramItem.title.toLowerCase(),
  );

  return (
    <RaisedCard data-testid="favorite-program-items-list">
      <MyProgramHeader>{t("favoriteProgramItems")}</MyProgramHeader>
      <div>
        {favoriteProgramItems.length === 0 && (
          <EmptyContentContainer>
            <MyProgramSecondaryText>
              {showAllProgramItems
                ? t("noFavoriteProgramItems")
                : t("noFutureFavoriteProgramItems")}
            </MyProgramSecondaryText>
            {!showAllProgramItems && (
              <ShowAllButton
                onClick={() => setShowAllProgramItems(!showAllProgramItems)}
              >
                {t("showAllProgramItems")}
              </ShowAllButton>
            )}
          </EmptyContentContainer>
        )}
        {favoriteProgramItems.length > 0 && (
          <FavoritesByStartTimes
            favoriteProgramItems={sortedFavoriteProgramItems}
          />
        )}
      </div>
    </RaisedCard>
  );
};
