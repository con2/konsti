import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
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
  const { pathname } = useLocation();
  // eslint-disable-next-line react/hook-use-state -- The route the error happened on never changes, so there is no setter to destructure
  const [failedPathname] = useState(pathname);

  // A boundary holds its failed state until something resets it, and the routes
  // are inside this one, so without this the header links would appear to do
  // nothing. Done here rather than by keying the boundary on the route, which
  // would remount every route element on every navigation
  useEffect(() => {
    if (pathname !== failedPathname) {
      props.resetError();
    }
  }, [pathname, failedPathname, props]);

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
