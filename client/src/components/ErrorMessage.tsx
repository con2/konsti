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
    <StyledErrorMessage>
      {message} <StyledIcon onClick={closeError} icon="xmark" />
    </StyledErrorMessage>
  );
};

const StyledErrorMessage = styled.span`
  font-weight: 600;
  color: ${(props) => props.theme.textError};
`;

const StyledIcon = styled(FontAwesomeIcon)`
  cursor: pointer;
  font-size: ${(props) => props.theme.fontSizeLarge};
  vertical-align: middle;
  margin-bottom: 1px;
`;
