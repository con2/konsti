import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { sortBy } from "lodash-es";
import styled from "styled-components";
import { getStartTimes } from "client/utils/getStartTimes";
import { FavoritesByStartTimes } from "./FavoritesByStartTimes";
import { ProgramItem } from "shared/types/models/programItem";
import { RaisedCard } from "client/components/RaisedCard";

interface Props {
  favoritedProgramItems: readonly ProgramItem[];
}

export const MyFavoritesList = ({
  favoritedProgramItems,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const sortedProgramItems: readonly ProgramItem[] = sortBy(
    favoritedProgramItems,
    [
      (favoritedProgramItem) => favoritedProgramItem.startTime,
      (favoritedProgramItem) => favoritedProgramItem.title.toLowerCase(),
    ],
  );

  const startTimes = getStartTimes(favoritedProgramItems);

  return (
    <RaisedCard data-testid="favorited-program-items-list">
      <Header>{t("favoritedProgramItems")}</Header>
      <div>
        {favoritedProgramItems.length === 0 && (
          <SecondaryText>{t("noFavoritedProgramItems")}</SecondaryText>
        )}
        {favoritedProgramItems.length !== 0 && (
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
