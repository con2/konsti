import React, { MouseEventHandler, ReactElement, ReactNode } from "react";
import styled, { css } from "styled-components";

interface Props {
  children?: ReactNode;
  onClick?: MouseEventHandler;
  disabled?: boolean;
  type?: "submit" | "reset" | "button";
  selected?: boolean;
  "data-testid"?: string;
}

export const Button = ({
  children,
  onClick,
  disabled = false,
  type = "button",
  "data-testid": dataTestId,
  selected = false,
}: Props): ReactElement => {
  return (
    <StyledButton
      onClick={onClick}
      disabled={disabled}
      type={type}
      data-testid={dataTestId}
      selected={selected}
    >
      {children}
    </StyledButton>
  );
};

interface StyledButtonProps {
  disabled: boolean;
  selected: boolean;
}

const StyledButton = styled.button<StyledButtonProps>`
  background: ${(props) => props.theme.buttonBackground};
  border: 1px solid ${(props) => props.theme.buttonBorder};
  border-radius: 5px;
  color: ${(props) => props.theme.buttonText};
  cursor: pointer;
  margin: 10px 10px 10px 0;
  padding: 6px 20px;
  font-size: ${(props) => props.theme.buttonFontSize};

  ${(buttonProps) =>
    buttonProps.selected &&
    css`
      background: ${(props) => props.theme.disabled};
    `};

  ${(buttonProps) =>
    buttonProps.disabled &&
    css`
      background: ${(props) => props.theme.disabled};
    `};

  &:hover,
  &:focus {
    ${(buttonProps) =>
      !buttonProps.disabled &&
      css`
        background: ${(props) => props.theme.backgroundActive};
        border: 1px solid ${(props) => props.theme.borderActive};
        color: ${(props) => props.theme.borderActive};
      `};
  }
`;
