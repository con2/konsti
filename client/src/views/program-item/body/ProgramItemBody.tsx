import { ReactElement, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { ProgramItem } from "shared/types/models/programItem";
import { ProgramItemDetails } from "client/views/program-item/body/components/ProgramItemDetails";
import { UserGroup } from "shared/types/models/user";
import { AdminActionCard } from "client/views/program-item/body/components/AdminActionCard";
import { useAppSelector } from "client/utils/hooks";
import { ExpandButton } from "client/components/ExpandButton";
import { TextWithLinks } from "client/markdown/components/TextWithLinks";
import { programItemCardEndMargin } from "client/views/my-program-items/components/shared";

interface Props {
  programItem: ProgramItem;
  isAlwaysExpanded: boolean;
  // True when nothing renders after the body (signup section hidden,
  // not cancelled), so the body provides the card-end spacing
  endOfCard: boolean;
}

export const ProgramItemBody = ({
  programItem,
  isAlwaysExpanded,
  endOfCard,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const userGroup = useAppSelector((state) => state.login.userGroup);

  const [isExpanded, setIsExpanded] = useState<boolean>(isAlwaysExpanded);

  const id = `more-info-${programItem.programItemId}`;

  return (
    <Container $endOfCard={endOfCard}>
      <ShortDescription>
        <TextWithLinks>{programItem.shortDescription}</TextWithLinks>
      </ShortDescription>
      {!isAlwaysExpanded && (
        <ExpandButton
          isExpanded={isExpanded}
          showMoreText={t("programItemInfo.showMore")}
          showLessText={t("programItemInfo.showLess")}
          showMoreAriaLabel={`${t("programItemInfo.showMoreAriaLabel")} ${programItem.title}`}
          showLessAriaLabel={`${t("programItemInfo.showLessAriaLabel")} ${programItem.title}`}
          ariaControls={id}
          onClick={() => setIsExpanded(!isExpanded)}
        />
      )}
      {isExpanded && (
        <ExpandedDescriptionContainer id={id}>
          <ProgramItemDetails programItem={programItem} />
          {loggedIn && userGroup === UserGroup.ADMIN && (
            <AdminActionCard programItem={programItem} />
          )}
        </ExpandedDescriptionContainer>
      )}
    </Container>
  );
};

const Container = styled.div<{ $endOfCard: boolean }>`
  ${(props) =>
    props.$endOfCard && `margin-bottom: ${programItemCardEndMargin};`}
`;

const ExpandedDescriptionContainer = styled.div`
  padding-top: 8px;
`;

const ShortDescription = styled.p`
  overflow-wrap: break-word;
  margin: 8px 0 8px 0;
`;
