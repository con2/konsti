import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { addOpacity } from "client/utils/addOpacity";

interface Props {
  message: string;
  // If left undefined, a close button won't be shown
  closeError?: () => void;
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
    <p>
      <Container>
        <ErrorIcon icon={"circle-exclamation"} />
        {message}
        {closeError && (
          <CloseIcon
            onClick={closeError}
            icon="xmark"
            aria-label={t("iconAltText.closeError")}
          />
        )}
      </Container>
    </p>
  );
};

const Container = styled.span`
  display: inline-block;
  padding: 8px 6px;
  border-radius: 5px;
  border: 1px solid ${(props) => props.theme.errorColor};
  background-color: ${(props) => addOpacity(props.theme.errorColor, "0.23")};
`;

const ErrorIcon = styled(FontAwesomeIcon)`
  padding-right: 8px;
  color: ${(props) => props.theme.errorColorIcon};
`;

const CloseIcon = styled(FontAwesomeIcon)`
  cursor: pointer;
  font-size: ${(props) => props.theme.fontSizeLarge};
  vertical-align: text-bottom;
  margin-left: 8px;
`;
