import { ReactElement, useMemo, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Game } from "shared/types/models/game";
import { getShortDescriptionFromDescription } from "client/utils/getShortDescriptionFromDescription";
import { GameInfo } from "client/views/all-games/components/GameInfo";
import { config } from "shared/config";
import { FeedbackForm } from "client/views/all-games/components/FeedbackForm";
import { UserGroup } from "shared/types/models/user";
import { AdminActionCard } from "client/views/all-games/components/AdminActionCard";
import { useAppSelector } from "client/utils/hooks";

interface Props {
  game: Game;
  isAlwaysExpanded: boolean;
}

export const GameDetailsView = ({
  game,
  isAlwaysExpanded,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const userGroup = useAppSelector((state) => state.login.userGroup);

  const shortDescription = useMemo(
    () =>
      game.shortDescription.length > 0
        ? game.shortDescription
        : getShortDescriptionFromDescription(game.description),
    [game],
  );

  const [isExpanded, setIsExpanded] = useState<boolean>(isAlwaysExpanded);

  const onButtonClick = (): void => {
    setIsExpanded(!isExpanded);
  };

  const id = `more-info-${game.gameId}`;
  const buttonAriaLabel = `${t(
    isExpanded ? "gameInfo.showLessAriaLabel" : "gameInfo.showMoreAriaLabel",
  )} ${game.title}`;

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
            {isExpanded ? t("gameInfo.showLess") : t("gameInfo.showMore")}
          </ExpandButton>
        </ButtonContainer>
      )}
      {isExpanded && (
        <ExpandedDescriptionContainer id={id}>
          <GameInfo game={game} />
          {loggedIn && config.client().enableOrganizerFeedback && (
            <FeedbackForm game={game} />
          )}
          {loggedIn && userGroup === UserGroup.ADMIN && (
            <AdminActionCard game={game} />
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
