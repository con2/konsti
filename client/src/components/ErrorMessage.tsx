import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

interface Props {
  message: string;
  closeError: () => void;
}

export const ErrorMessage = ({
  message,
  closeError,
}: Props): ReactElement | null => {
  const { t } = useTranslation();

  if (!message) {
    return null;
  }
  return (
    <ErrorContainer>
      <StyledErrorMessage>{message}</StyledErrorMessage>
      <StyledIcon
        onClick={closeError}
        icon="xmark"
        aria-label={t("iconAltText.closeError")}
      />
    </ErrorContainer>
  );
};

const ErrorContainer = styled.div`
  height: 24px;
`;

const StyledErrorMessage = styled.span`
  line-height: 24px;
  margin-right: 8px;
  color: ${(props) => props.theme.textError};
`;

const StyledIcon = styled(FontAwesomeIcon)`
  cursor: pointer;
  font-size: ${(props) => props.theme.fontSizeLarge};
  vertical-align: text-bottom;
`;
