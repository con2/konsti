import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import styled from "styled-components";
import { config } from "shared/config";
import { AppRoute } from "client/app/AppRoutes";
import { LanguageSelector } from "client/components/LanguageSelector";
import KonstiLogo from "client/components/icons/konsti.svg";
import { useTimeNow } from "client/utils/getTimeNow";
import { isMainEventProgramVisible } from "client/utils/getUpcomingProgramItems";
import { useAppSelector } from "client/utils/hooks";
import { Navigation } from "./Navigation";

export const HEADER_HEIGHT = 40;

export const Header = (): ReactElement => {
  const { t } = useTranslation();
  const { eventName, eventYear } = config.event();

  const appOpen = useAppSelector((state) => state.admin.appOpen);

  // During pre-convention week the title shows the pre-convention week program is on
  const appDescriptionKey = isMainEventProgramVisible(useTimeNow())
    ? "appDescription"
    : "appDescriptionPreConventionWeek";

  return (
    <>
      <HeaderContainer>
        <Navigation />

        <HeaderTitle>
          <KonstiIcon aria-label={t("logoAltText")} />
          {t(appDescriptionKey, {
            EVENT_NAME: eventName,
            EVENT_YEAR: eventYear,
          })}
        </HeaderTitle>

        <HeaderRightSideContainer>
          <StyledLink
            to={AppRoute.ABOUT}
            aria-label={t("iconAltText.aboutKonsti")}
          >
            <LinkIcon icon="circle-question" aria-hidden="true" />
          </StyledLink>
          <HeaderLanguageSelector />
        </HeaderRightSideContainer>
      </HeaderContainer>

      {!appOpen && <ClosingMessage>{t("closingMessage")}</ClosingMessage>}
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
  background: ${(props) => props.theme.backgroundHeader};
  border-bottom: 1px solid ${(props) => props.theme.borderHeader};
  box-shadow: ${(props) => props.theme.shadowHeader};
  margin-bottom: 8px;
  color: ${(props) => props.theme.textLighter};
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

const LinkIcon = styled(FontAwesomeIcon)`
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

const KonstiIcon = styled(KonstiLogo)`
  width: 24px;
  height: 24px;
  vertical-align: middle;
  padding-right: 8px;
`;
