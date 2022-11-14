import React, { ReactElement, useMemo, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Game } from "shared/typings/models/game";
import { ExpandedGameDescription } from "client/views/all-games/components/ExpandedGameDescription";

const DESCRIPTION_SENTENCES_LENGTH = 3;
const matchNextSentence = /([.?!])\s*(?=[A-Z])/g;

interface Props {
  game: Game;
  isAlwaysExpanded: boolean;
}

export const GameDetailsView = ({
  game,
  isAlwaysExpanded,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const shortDescription = useMemo(
    () =>
      game.shortDescription ??
      game.description
        .replace(matchNextSentence, "$1|")
        .split("|")
        .slice(0, DESCRIPTION_SENTENCES_LENGTH)
        .join(" "),
    [game]
  );

  const [isExpanded, setIsExpanded] = useState<boolean>(isAlwaysExpanded);

  const onButtonClick = (): void => {
    setIsExpanded(!isExpanded);
  };

  const id = `more-info-${game.gameId}`;
  const buttonAriaLabel = `${t(
    isExpanded ? "gameInfo.showLessAriaLabel" : "gameInfo.showMoreAriaLabel"
  )} ${game.title}`;

  return (
    <>
      <span>{`${shortDescription} `}</span>
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
          <ExpandedGameDescription game={game} />
        </ExpandedDescriptionContainer>
      )}
    </>
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
