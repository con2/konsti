import { ReactElement, useMemo, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProgramItem } from "shared/types/models/programItem";
import { getShortDescriptionFromDescription } from "client/utils/getShortDescriptionFromDescription";
import { ProgramItemInfo } from "client/views/all-program-items/components/ProgramItemInfo";
import { config } from "shared/config";
import { FeedbackForm } from "client/views/all-program-items/components/FeedbackForm";
import { UserGroup } from "shared/types/models/user";
import { AdminActionCard } from "client/views/all-program-items/components/AdminActionCard";
import { useAppSelector } from "client/utils/hooks";

interface Props {
  programItem: ProgramItem;
  isAlwaysExpanded: boolean;
}

export const ProgramItemDetailsView = ({
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

  const onButtonClick = (): void => {
    setIsExpanded(!isExpanded);
  };

  const id = `more-info-${programItem.programItemId}`;
  const buttonAriaLabel = `${t(
    isExpanded
      ? "programItemInfo.showLessAriaLabel"
      : "programItemInfo.showMoreAriaLabel",
  )} ${programItem.title}`;

  return (
    <div>
      <ShortDescription>{`${shortDescription} `}</ShortDescription>
      {!isAlwaysExpanded && (
        <ButtonContainer>
          <ArrowIcon
            aria-hidden="true"
            icon={isExpanded ? "angle-up" : "angle-down"}
          />
          <ExpandButton
            aria-controls={id}
            aria-expanded={isExpanded}
            aria-label={buttonAriaLabel}
            onClick={onButtonClick}
            role="button"
          >
            {isExpanded
              ? t("programItemInfo.showLess")
              : t("programItemInfo.showMore")}
          </ExpandButton>
        </ButtonContainer>
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

const ArrowIcon = styled(FontAwesomeIcon)`
  margin: 0 8px 4px 0;
  font-size: 16px;
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
`;

const ExpandButton = styled.p`
  cursor: pointer;
  text-decoration: underline;
`;

const ExpandedDescriptionContainer = styled.div`
  padding-top: 16px;
`;

const ShortDescription = styled.span`
  overflow-wrap: break-word;
  word-break: break-word;
`;
