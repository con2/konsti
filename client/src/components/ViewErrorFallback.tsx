import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button } from "client/components/Button";
import { RaisedCard } from "client/components/RaisedCard";
import { ButtonStyle } from "client/components/componentStyles";

interface Props {
  resetError: () => void;
}

// Shown in place of a view that threw while rendering. Kept deliberately plain:
// it renders inside a tree that has just failed, so it depends on nothing but
// translations
export const ViewErrorFallback = (props: Props): ReactElement => {
  const { t } = useTranslation();

  return (
    <RaisedCard data-testid="view-error">
      <Heading>{t("viewError.title")}</Heading>
      <p>{t("viewError.description")}</p>
      <Button
        buttonStyle={ButtonStyle.PRIMARY}
        onClick={() => {
          props.resetError();
        }}
      >
        {t("viewError.retry")}
      </Button>
    </RaisedCard>
  );
};

const Heading = styled.h2`
  margin-top: 0;
  font-size: ${(props) => props.theme.fontSizeLarge};
`;
