import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { ReactElement } from "react";
import styled from "styled-components";

interface Props {
  message: string;
  closeError: () => void;
}

export const ErrorMessage = ({
  message,
  closeError,
}: Props): ReactElement | null => {
  if (!message) return null;
  return (
    <ErrorContainer>
      <StyledErrorMessage>{message}</StyledErrorMessage>
      <StyledIcon onClick={closeError} icon="xmark" />
    </ErrorContainer>
  );
};

const ErrorContainer = styled.div`
  height: 24px;
`;

const StyledErrorMessage = styled.span`
  line-height: 24px;
  margin-right: 8px;
  font-weight: 600;
  color: ${(props) => props.theme.textError};
`;

const StyledIcon = styled(FontAwesomeIcon)`
  border: 1px solid ${(props) => props.theme.errorCloseButtonBorder};
  border-radius: 12px;
  width: 18px;
  height: 18px;
  cursor: pointer;
  font-size: ${(props) => props.theme.fontSizeLarge};
  vertical-align: middle;
  margin-bottom: 2px;
  background-color: ${(props) => props.theme.errorCloseButtonBackground};
`;
