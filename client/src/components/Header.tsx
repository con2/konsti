import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { LanguageSelector } from 'client/components/LanguageSelector';
import { config } from 'client/config';
import { TimeSelector } from 'client/test/test-components/TimeSelector';
import { Navigation } from './Navigation';

export const Header = (): ReactElement => {
  const { t } = useTranslation();
  const {
    loadedSettings,
    CONVENTION_NAME,
    CONVENTION_YEAR,
    useTestTime,
  } = config;

  return (
    <>
      {loadedSettings !== 'production' && useTestTime && <TimeSelector />}
      <HeaderContainer>
        <Navigation />

        <HeaderBar>
          {t('appDescription', { CONVENTION_NAME, CONVENTION_YEAR })}
        </HeaderBar>
        <HeaderLanguageSelector />
      </HeaderContainer>
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
  background-color: black;
  color: white;
  width: 100%;
  height: 40px;
`;

const HeaderBar = styled.div`
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  justify-content: space-between;
`;
