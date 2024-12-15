import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LanguageSelector } from "client/components/LanguageSelector";
import { Navigation } from "./Navigation";
import { FirstLogin } from "./FirstLogin";
import { useAppSelector } from "client/utils/hooks";
import { config } from "shared/config";
import { AppRoute } from "client/app/AppRoutes";

export const HEADER_HEIGHT = 40;

export const Header = (): ReactElement => {
  const { t } = useTranslation();
  const { eventName, eventYear } = config.event();

  const appOpen = useAppSelector((state) => state.admin.appOpen);

  return (
    <>
      <HeaderContainer>
        <Navigation />

        <HeaderTitle>
          {t("appDescription", {
            EVENT_NAME: eventName,
            EVENT_YEAR: eventYear,
          })}
        </HeaderTitle>

        <HeaderRightSideContainer>
          <StyledLink
            to={AppRoute.ABOUT}
            aria-label={t("iconAltText.aboutKonsti")}
          >
            <StyledIcon icon="circle-question" aria-hidden="true" />
          </StyledLink>
          <HeaderLanguageSelector />
        </HeaderRightSideContainer>
      </HeaderContainer>

      {!appOpen && <ClosingMessage>{t("closingMessage")}</ClosingMessage>}

      <FirstLogin />
    </>
  );
};

const HeaderLanguageSelector = styled(LanguageSelector)`
  margin: 8px;
`;

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fafafa;
  border-bottom: 1px solid #d5d5d5;
  box-shadow: 4px 4px 45px 4px #d5d5d5;
  margin-bottom: 8px;
  color: #282828;
  width: 100%;
  height: ${HEADER_HEIGHT}px;
`;

const HeaderTitle = styled.div`
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  text-align: center;
  margin: 4px 8px 4px 8px;
`;

const ClosingMessage = styled.h2`
  text-align: center;
`;

const StyledLink = styled(Link)`
  margin-right: 12px;
`;

const StyledIcon = styled(FontAwesomeIcon)`
  cursor: pointer;
  font-size: ${(props) => props.theme.fontSizeLarge};
  vertical-align: middle;
  margin-bottom: 1px;
  color: ${(props) => props.theme.iconDefault};
`;

const HeaderRightSideContainer = styled.div`
  display: flex;
  align-items: center;
  white-space: nowrap;
  margin-right: 8px;
`;
