import { MouseEventHandler, ReactElement, ReactNode } from "react";
import styled from "styled-components";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
  children?: ReactNode;
  onClick?: MouseEventHandler;
  className?: string;
  icon?: IconProp;
}

export const TertiaryButton = ({
  children,
  onClick,
  className,
  icon,
}: Props): ReactElement => {
  return (
    <StyledButton className={className} onClick={onClick}>
      {icon && <StyledIcon icon={icon} aria-hidden="true" />}
      {children}
    </StyledButton>
  );
};

const StyledIcon = styled(FontAwesomeIcon)`
  color: ${(props) => props.theme.textLink};
  font-size: ${(props) => props.theme.iconSizeSmall};
  padding-right: 4px;
  vertical-align: middle;
`;

const StyledButton = styled.button`
  font-size: ${(props) => props.theme.fontSizeSmall};
  text-decoration: underline;
  color: ${(props) => props.theme.textLink};
  cursor: pointer;
  border: none;
  background-color: inherit;
  padding-left: 0;
`;
