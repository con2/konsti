import { MouseEventHandler, ReactElement } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface Props {
  isFavorite: boolean;
  onClick?: MouseEventHandler;
}

export const FavoriteButton = ({
  isFavorite,
  onClick,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const dataTestId = isFavorite
    ? "remove-favorite-button"
    : "add-favorite-button";

  const ariaLabelKey = isFavorite
    ? "iconAltText.deleteFavorite"
    : "iconAltText.addFavorite";

  const icon: IconProp = isFavorite ? "heart" : ["far", "heart"];

  return (
    <StyledButton
      onClick={onClick}
      data-testid={dataTestId}
      aria-label={t(ariaLabelKey)}
    >
      <FavoriteIcon icon={icon} aria-hidden="true" />
    </StyledButton>
  );
};

const StyledButton = styled.button`
  border-radius: 100px;
  border: none;
  cursor: pointer;
  width: 44px;
  height: 44px;
  background-color: inherit;

  &:hover,
  &:focus-visible {
    background: ${(props) => props.theme.buttonSecondaryHover};
    color: ${(props) => props.theme.textMain};
  }

  &:active {
    background: ${(props) => props.theme.buttonSecondaryClicked};
  }
`;

const FavoriteIcon = styled(FontAwesomeIcon)`
  color: ${(props) => props.theme.iconFavorite};
  font-size: ${(props) => props.theme.iconSizeLarge};
`;
