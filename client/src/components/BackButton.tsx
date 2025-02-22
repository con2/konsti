import { ReactElement } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { navigateToPreviousOrRoot } from "client/utils/navigation";

export const BackButton = (): ReactElement => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const goBack = async (): Promise<void> => {
    await navigateToPreviousOrRoot(globalThis.history, navigate);
  };

  return (
    <Container
      role="link"
      tabIndex={0}
      onClick={goBack}
      onKeyDown={async (event) => {
        if (event.key === "Enter") {
          await goBack();
        }
      }}
    >
      <Icon icon="circle-chevron-left" aria-hidden={true} />
      <Text>{t("button.back")}</Text>
    </Container>
  );
};

const Container = styled.div`
  background: none;
  border: none;
  padding: 8px 0 8px 4px;
  color: ${(props) => props.theme.textLink};
  font-size: ${(props) => props.theme.linkFontSize};
  cursor: pointer;
`;

const Text = styled.span`
  text-decoration: underline;
`;

const Icon = styled(FontAwesomeIcon)`
  padding-right: 4px;
`;
