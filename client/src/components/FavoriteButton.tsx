import React, { MouseEventHandler, ReactElement } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

export enum FavoriteButtonSize {
  SMALL = "small",
  LARGE = "large",
}

interface Props {
  isFavorite: boolean;
  onClick?: MouseEventHandler;
  buttonSize?: FavoriteButtonSize;
}

export const FavoriteButton = ({
  isFavorite,
  onClick,
  buttonSize = FavoriteButtonSize.LARGE,
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
      buttonSize={buttonSize}
      isFavorite={isFavorite}
      onClick={onClick}
      data-testid={dataTestId}
      aria-label={t(ariaLabelKey)}
    >
      <FavoriteIcon $buttonSize={buttonSize} icon={icon} aria-hidden="true" />
    </StyledButton>
  );
};

const smallSize = "32px";
const largeSize = "48px";

const StyledButton = styled.button<Props>`
  border-radius: 100px;
  border: none;
  cursor: pointer;
  box-shadow: rgba(0, 0, 0, 0.15) 0 3px 5px;
  width: ${(props) =>
    props.buttonSize === FavoriteButtonSize.SMALL ? smallSize : largeSize};
  height: ${(props) =>
    props.buttonSize === FavoriteButtonSize.SMALL ? smallSize : largeSize};
  background-color: ${(props) => props.theme.buttonSecondaryBackground};

  &:hover,
  &:focus-visible {
    background: ${(props) => props.theme.buttonSecondaryHover};
    color: ${(props) => props.theme.textMain};
  }

  &:active {
    background: ${(props) => props.theme.buttonSecondaryClicked};
    box-shadow: none;
  }
`;

const FavoriteIcon = styled(FontAwesomeIcon)<{
  $buttonSize: FavoriteButtonSize;
}>`
  color: ${(props) => props.theme.iconFavorited};
  font-size: ${(props) =>
    props.$buttonSize === FavoriteButtonSize.SMALL
      ? props.theme.fontSizeNormal
      : props.theme.fontSizeLarge};
`;
