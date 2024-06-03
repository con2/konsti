import { ReactElement, useMemo, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { ProgramItem } from "shared/types/models/programItem";
import { getShortDescriptionFromDescription } from "client/utils/getShortDescriptionFromDescription";
import { ProgramItemInfo } from "client/views/all-program-items/components/ProgramItemInfo";
import { config } from "shared/config";
import { FeedbackForm } from "client/views/all-program-items/components/FeedbackForm";
import { UserGroup } from "shared/types/models/user";
import { AdminActionCard } from "client/views/all-program-items/components/AdminActionCard";
import { useAppSelector } from "client/utils/hooks";
import { ExpandButton } from "client/components/ExpandButton";

interface Props {
  programItem: ProgramItem;
  isAlwaysExpanded: boolean;
}

export const ProgramItemView = ({
  programItem,
  isAlwaysExpanded,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const userGroup = useAppSelector((state) => state.login.userGroup);

  const shortDescription = useMemo(
    () =>
      programItem.shortDescription.length > 0
        ? programItem.shortDescription
        : getShortDescriptionFromDescription(programItem.description),
    [programItem],
  );

  const [isExpanded, setIsExpanded] = useState<boolean>(isAlwaysExpanded);

  const id = `more-info-${programItem.programItemId}`;

  return (
    <div>
      <ShortDescription>{`${shortDescription} `}</ShortDescription>
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
          <ProgramItemInfo programItem={programItem} />
          {loggedIn && config.client().enableOrganizerFeedback && (
            <FeedbackForm programItem={programItem} />
          )}
          {loggedIn && userGroup === UserGroup.ADMIN && (
            <AdminActionCard programItem={programItem} />
          )}
        </ExpandedDescriptionContainer>
      )}
    </div>
  );
};

const ExpandedDescriptionContainer = styled.div`
  padding-top: 8px;
`;

const ShortDescription = styled.p`
  overflow-wrap: break-word;
  word-break: break-word;
  margin: 8px 0 8px 0;
`;
