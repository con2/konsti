import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { sortBy } from "lodash-es";
import styled from "styled-components";
import { getStartTimes } from "client/utils/getStartTimes";
import { FavoritesByStartTimes } from "./FavoritesByStartTimes";
import { ProgramItem } from "shared/types/models/programItem";
import { RaisedCard } from "client/components/RaisedCard";

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
    <RaisedCard data-testid="favorite-program-items-list">
      <Header>{t("favoriteProgramItems")}</Header>
      <div>
        {favoriteProgramItems.length === 0 && (
          <SecondaryText>{t("noFavoriteProgramItems")}</SecondaryText>
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

const Header = styled.h3`
  margin: 0 0 12px 0;
`;

const SecondaryText = styled.span`
  color: ${(props) => props.theme.textSecondary};
`;
