import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { LanguageSelector } from 'client/components/LanguageSelector';
import { config } from 'client/config';
import { TestTimeSelector } from 'client/test/test-components/TestTimeSelector';
import { Navigation } from './Navigation';
import { FirstLogin } from './FirstLogin';

export const Header = (): ReactElement => {
  const { t } = useTranslation();
  const { loadedSettings, CONVENTION_NAME, CONVENTION_YEAR, useTestTime } =
    config;

  return (
    <>
      {loadedSettings !== 'production' && useTestTime && <TestTimeSelector />}
      <HeaderContainer>
        <Navigation />

        <HeaderBar>
          {t('appDescription', { CONVENTION_NAME, CONVENTION_YEAR })}
        </HeaderBar>
        <HeaderLanguageSelector />
      </HeaderContainer>
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
  height: 40px;
`;

const HeaderBar = styled.div`
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  justify-content: space-between;
`;
