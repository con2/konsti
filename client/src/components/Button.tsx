import { MouseEventHandler, ReactElement, ReactNode } from "react";
import styled, { css } from "styled-components";

export enum ButtonStyle {
  PRIMARY = "primary",
  SECONDARY = "secondary",
}

interface Props {
  children?: ReactNode;
  disabled?: boolean;
  onClick?: MouseEventHandler;
  buttonStyle: ButtonStyle;
  type?: "submit" | "button";
  className?: string;
  "data-testid"?: string;
  "aria-label"?: string;
}

export const Button = ({
  children,
  disabled,
  onClick,
  buttonStyle,
  type = "button",
  className,
  "data-testid": dataTestId,
  "aria-label": ariaLabel,
}: Props): ReactElement => {
  return (
    <StyledButton
      className={className}
      onClick={onClick}
      type={type}
      data-testid={dataTestId}
      $buttonStyle={buttonStyle}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </StyledButton>
  );
};

const disabledButton = css`
  opacity: 0.4;
  cursor: not-allowed;
`;

const StyledButton = styled.button<{ $buttonStyle: ButtonStyle }>`
  border-radius: 6px;
  cursor: pointer;
  box-shadow: rgba(0, 0, 0, 0.18) 0 3px 5px;
  font-size: ${(props) => props.theme.fontSizeSmall};
  white-space: nowrap;

  ${(props) => {
    if (props.disabled && props.$buttonStyle === ButtonStyle.SECONDARY) {
      return `
          background: ${props.theme.buttonSecondaryBackground};
          border: 2px solid ${props.theme.buttonSecondaryBorder};
          color: ${props.theme.textMain};
          padding: 6px 20px;

          ${disabledButton}`; // eslint-disable-line @typescript-eslint/restrict-template-expressions
    }
    if (!props.disabled && props.$buttonStyle === ButtonStyle.SECONDARY) {
      return `
          background: ${props.theme.buttonSecondaryBackground};
          border: 2px solid ${props.theme.buttonSecondaryBorder};
          color: ${props.theme.textMain};
          padding: 6px 20px;

          &:hover, &:focus-visible {
            background: ${props.theme.buttonSecondaryHover};
            color: ${props.theme.textMain};
          }

          &:active {
            background: ${props.theme.buttonSecondaryClicked};
            box-shadow: none;
          }
      `;
    }
    if (props.disabled && props.$buttonStyle === ButtonStyle.PRIMARY) {
      return `
          background: ${props.theme.buttonPrimaryBackground};
          border: none;
          color: ${props.theme.buttonPrimaryText};
          padding: 8px 20px;

          ${disabledButton}`; // eslint-disable-line @typescript-eslint/restrict-template-expressions
    }

    // Default: primary, not disabled
    return `
          background: ${props.theme.buttonPrimaryBackground};
          border: none;
          color: ${props.theme.buttonPrimaryText};
          padding: 8px 20px;

          &:hover, &:focus-visible {
            background: ${props.theme.buttonPrimaryHover};
            color: ${props.theme.buttonPrimaryText};
            }
          &:active {
            background: ${props.theme.buttonPrimaryClicked};
            box-shadow: none;
            }
      `;
  }}
`;
