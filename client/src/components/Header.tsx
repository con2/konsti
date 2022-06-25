import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LanguageSelector } from "client/components/LanguageSelector";
import { Navigation } from "./Navigation";
import { FirstLogin } from "./FirstLogin";
import { useAppSelector } from "client/utils/hooks";
import { sharedConfig } from "shared/config/sharedConfig";

export const HEADER_HEIGHT = 40;

export const Header = (): ReactElement => {
  const { t } = useTranslation();
  const { CONVENTION_NAME, CONVENTION_YEAR } = sharedConfig;

  const appOpen = useAppSelector((state) => state.admin.appOpen);

  return (
    <>
      <HeaderContainer>
        <Navigation />

        <HeaderTitle>
          {t("appDescription", { CONVENTION_NAME, CONVENTION_YEAR })}
        </HeaderTitle>

        <HeaderRightSideContainer>
          <StyledLink to={"/about"}>
            <StyledIcon icon="circle-question" />
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
  justify-content: space-between;
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
  color: ${(props) => props.theme.textMain};
`;

const HeaderRightSideContainer = styled.div`
  display: flex;
  align-items: center;
  white-space: nowrap;
`;
