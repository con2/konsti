import React, { MouseEventHandler, ReactElement } from 'react';
import styled, { css } from 'styled-components';

interface Props {
  children: ReactElement;
  onClick?: MouseEventHandler;
  disabled?: boolean;
  type?: 'submit' | 'reset' | 'button';
}

export const Button = ({
  children,
  onClick,
  disabled = false,
  type = 'button',
}: Props): ReactElement => {
  return (
    <StyledButton onClick={onClick} disabled={disabled} type={type}>
      {children}
    </StyledButton>
  );
};

interface StyledButtonProps {
  disabled: boolean;
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
    buttonProps.disabled &&
    css`
      background-color: ${(props) => props.theme.disabled};
    `};

  &:hover,
  &:focus {
    ${(buttonProps) =>
      !buttonProps.disabled &&
      css`
        background-color: ${(props) => props.theme.backgroundActive};
        border: 1px solid ${(props) => props.theme.borderActive};
        color: ${(props) => props.theme.borderActive};
      `};
  }
`;
