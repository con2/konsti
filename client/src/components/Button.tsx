import React, { MouseEventHandler, ReactElement, ReactNode } from "react";
import styled from "styled-components";

export enum ButtonStyle {
  NORMAL = "normal",
  DISABLED = "disabled",
  WARNING = "warning",
}

interface Props {
  children?: ReactNode;
  onClick?: MouseEventHandler;
  buttonStyle: ButtonStyle;
  type?: "submit" | "button";
  className?: string;
  "data-testid"?: string;
}

export const Button = ({
  children,
  onClick,
  buttonStyle,
  type = "button",
  className,
  "data-testid": dataTestId,
}: Props): ReactElement => {
  return (
    <StyledButton
      className={className}
      onClick={onClick}
      type={type}
      data-testid={dataTestId}
      buttonStyle={buttonStyle}
      disabled={buttonStyle === ButtonStyle.DISABLED}
    >
      {children}
    </StyledButton>
  );
};

interface StyledButtonProps {
  buttonStyle: ButtonStyle;
}

const StyledButton = styled.button<StyledButtonProps>`
  border-radius: 5px;
  cursor: pointer;
  margin: 10px 10px 10px 0;
  padding: 6px 20px;
  font-size: ${(props) => props.theme.fontSizeSmall};

  ${(props) => {
    switch (props.buttonStyle) {
      case ButtonStyle.NORMAL:
        return `
          background: ${props.theme.buttonBackground};
          border: 1px solid ${props.theme.buttonBorder};
          color: ${props.theme.buttonText};

          &:hover,
          &:focus {
            background: ${props.theme.backgroundActive};
            border: 1px solid ${props.theme.borderActive};
            color: ${props.theme.borderActive};
          }
      `;

      case ButtonStyle.DISABLED:
        return `
          background: ${props.theme.buttonBackgroundDisabled};
          border: 1px solid ${props.theme.buttonBorder};
          color: ${props.theme.buttonText};
          opacity: 0.5;
          cursor: not-allowed;
        `;

      case ButtonStyle.WARNING:
        return `
          background: ${props.theme.buttonWarning};
          border: 1px solid ${props.theme.buttonBorderWarning};
          color: ${props.theme.textMain};

          &:hover,
          &:focus {
            border: 1px solid ${props.theme.buttonBorderWarning};
            background: ${props.theme.buttonWarningHover};
            color: ${props.theme.textMain};
          }
      `;
    }
  }}
`;
