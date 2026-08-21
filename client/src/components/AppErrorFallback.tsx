import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button } from "client/components/Button";
import { ButtonStyle } from "client/components/componentStyles";

// Shown when the app itself fails before any of it is on screen, so it can lean
// on nothing the app sets up: no router, no store, no polled data. Only the
// theme and translations, both of which are ready before the app is loaded
export const AppErrorFallback = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <Container data-testid="app-error">
      <Heading>{t("appError.title")}</Heading>
      <p>{t("appError.description")}</p>
      <Button
        buttonStyle={ButtonStyle.PRIMARY}
        onClick={() => {
          // The lazy import is attempted again on the next load, so this is a
          // real retry rather than a repaint
          location.reload();
        }}
      >
        {t("appError.reload")}
      </Button>
    </Container>
  );
};

const Container = styled.div`
  margin: 0 auto;
  max-width: 500px;
  padding: 24px 16px;
  text-align: center;
`;

const Heading = styled.h1`
  font-size: ${(props) => props.theme.fontSizeLarge};
`;
