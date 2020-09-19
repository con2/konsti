import React, { ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from 'components/LanguageSelector';
import styled from 'styled-components';
import { config } from 'config';
import { TimeSelector } from 'test/test-components/TimeSelector';
import { RootState } from 'typings/redux.typings';

export const Header = (): ReactElement => {
  const username: string = useSelector(
    (state: RootState) => state.login.username
  );
  const loggedIn: boolean = useSelector(
    (state: RootState) => state.login.loggedIn
  );
  const serial: string = useSelector((state: RootState) => state.login.serial);
  const { t } = useTranslation();
  const {
    loadedSettings,
    CONVENTION_NAME,
    CONVENTION_YEAR,
    useTestTime,
  } = config;

  return (
    <HeaderContainer>
      {loadedSettings !== 'production' && useTestTime && <TimeSelector />}

      <h1>
        <Logo href='/'>{t('appTitle')}</Logo>
      </h1>

      <HeaderBar>
        {t('appDescription', { CONVENTION_NAME, CONVENTION_YEAR })}
        <LanguageSelector />
      </HeaderBar>

      {loggedIn && (
        <LoggedUserDetails>
          <UserInfo>
            {t('user')}: {username}
          </UserInfo>
          <UserInfo>
            {t('code')}: {serial}
          </UserInfo>
        </LoggedUserDetails>
      )}
    </HeaderContainer>
  );
};

const HeaderContainer = styled.header`
  padding: 0 0 20px;
`;

const Logo = styled.a`
  color: ${(props) => props.theme.mainText};
  text-decoration: none;
`;

const HeaderBar = styled.div`
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  justify-content: space-between;
`;

const LoggedUserDetails = styled.div`
  display: flex;
  flex: 0 1 auto;
  flex-direction: column;
`;

const UserInfo = styled.span`
  padding: 6px 0 0 0;
`;
