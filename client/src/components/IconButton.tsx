import { MouseEventHandler, ReactElement } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import { IconName } from "@fortawesome/free-solid-svg-icons";

interface Props {
  icon: IconName;
  className?: string;
  onClick?: MouseEventHandler;
}

export const IconButton = ({
  icon,
  className,
  onClick,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const dataTestId = "remove-favorite-button";
  const ariaLabelKey = "iconAltText.deleteFavorite";

  return (
    <StyledButton
      className={className}
      onClick={onClick}
      data-testid={dataTestId}
      aria-label={t(ariaLabelKey)}
    >
      <Icon className={className} icon={icon} aria-hidden="true" />
    </StyledButton>
  );
};

const StyledButton = styled.button<Props>`
  border-radius: 100px;
  border: none;
  cursor: pointer;
  width: 32px;
  height: 32px;
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

const Icon = styled(FontAwesomeIcon)`
  color: ${(props) => props.theme.iconFavorited};
  font-size: ${(props) => props.theme.iconSizeNormal};
`;
