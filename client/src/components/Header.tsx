import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { LanguageSelector } from "client/components/LanguageSelector";
import { config } from "client/config";
import { TestTimeSelector } from "client/test/test-components/TestTimeSelector";
import { Navigation } from "./Navigation";
import { FirstLogin } from "./FirstLogin";
import { useAppSelector } from "client/utils/hooks";
import { sharedConfig } from "shared/config/sharedConfig";
import { SignupStrategySelector } from "client/test/test-components/SignupStrategySelector";

export const TEST_VALUES_HEIGHT = 30;
export const TEST_VALUES_MARGIN = 20;
export const HEADER_HEIGHT = 40;

export const Header = (): ReactElement => {
  const { t } = useTranslation();
  const { loadedSettings, showTestValues } = config;
  const { CONVENTION_NAME, CONVENTION_YEAR } = sharedConfig;

  const appOpen = useAppSelector((state) => state.admin.appOpen);

  return (
    <>
      {loadedSettings !== "production" && showTestValues && (
        <TestValuesContainer>
          <TestTimeSelector />
          <SignupStrategySelector />
        </TestValuesContainer>
      )}

      <HeaderContainer>
        <Navigation />

        <HeaderBar>
          {t("appDescription", { CONVENTION_NAME, CONVENTION_YEAR })}
        </HeaderBar>
        <HeaderLanguageSelector />
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

const HeaderBar = styled.div`
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  justify-content: space-between;
`;

const ClosingMessage = styled.h2`
  text-align: center;
`;

const TestValuesContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  height: ${TEST_VALUES_HEIGHT}px;
  margin: ${TEST_VALUES_MARGIN}px 0;
`;
