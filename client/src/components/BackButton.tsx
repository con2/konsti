import { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const BackButton = (): ReactElement => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const goBack = (): void => {
    // Navigate to front page if no previous page exists
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions, @typescript-eslint/no-unsafe-member-access
    window.history.state?.idx > 0 ? navigate(-1) : navigate("/");
  };

  return (
    <Container
      role="link"
      tabIndex={0}
      onClick={goBack}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          goBack();
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
