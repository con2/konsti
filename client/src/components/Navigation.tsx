import React, { ReactElement, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { RootState } from 'typings/redux.typings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import { UserGroup } from 'typings/user.typings';

export const Navigation = (): ReactElement => {
  const username: string = useSelector(
    (state: RootState) => state.login.username
  );
  const loggedIn: boolean = useSelector(
    (state: RootState) => state.login.loggedIn
  );
  const serial: string = useSelector((state: RootState) => state.login.serial);
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);

  const icon = isOpen ? 'times' : 'bars';
  return (
    <>
      <NavigationIconContainer>
        <NavigationIcon icon={icon} onClick={() => setIsOpen(!isOpen)} />
      </NavigationIconContainer>
      {isOpen && (
        <Drawer>
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
          {loggedIn ? <LoggedInUserNavigation /> : <UserNavigation />}
        </Drawer>
      )}
    </>
  );
};

const LoggedInUserNavigation = (): ReactElement => {
  const userGroup: UserGroup = useSelector(
    (state: RootState) => state.login.userGroup
  );
  const { t } = useTranslation();

  return (
    <StyledRoutes>
      <RouterLink to='/games'>{t('pages.allGames')}</RouterLink>

      {userGroup === 'user' && (
        <RouterLink to='/mygames'>{t('pages.myGames')}</RouterLink>
      )}

      {userGroup === 'user' && (
        <RouterLink to='/signup'>{t('pages.signUp')}</RouterLink>
      )}

      {(userGroup === 'user' ||
        userGroup === 'admin' ||
        userGroup === 'help') && (
        <RouterLink to='/results'>{t('pages.results')}</RouterLink>
      )}

      {userGroup === 'user' && (
        <RouterLink to='/group'>{t('pages.group')}</RouterLink>
      )}

      {(userGroup === 'help' || userGroup === 'admin') && (
        <RouterLink to='/help'>{t('button.helper')}</RouterLink>
      )}

      {userGroup === 'admin' && (
        <RouterLink to='/admin'>{t('pages.admin')}</RouterLink>
      )}

      {(userGroup === 'user' ||
        userGroup === 'admin' ||
        userGroup === 'help') && (
        <RouterLink to='/logout'>{t('button.logout')}</RouterLink>
      )}
    </StyledRoutes>
  );
};

const UserNavigation = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <StyledRoutes>
      <RouterLink to='/games'>{t('pages.allGames')}</RouterLink>

      <RouterLink to='/login'>{t('button.login')}</RouterLink>

      <RouterLink to='/registration'>{t('button.register')}</RouterLink>
    </StyledRoutes>
  );
};

const NavigationIcon = styled(FontAwesomeIcon)`
  color: white;
`;

const NavigationIconContainer = styled.span`
  margin: 0 8px;
  font-size: 30px;
  width: 32px;
  height: 32px;
`;

const Drawer = styled.div`
  background-color: white;
  position: absolute;
  top: 87px;
  left: 0;
  bottom: 0;
  width: 60%;
  z-index: 10;
  border-right: 1px solid black;
  color: black;
  background-color: ${(props) => props.theme.backgroundHighlight};
`;

const LoggedUserDetails = styled.div`
  display: flex;
  flex: 0 1 auto;
  flex-direction: column;
`;

const UserInfo = styled.span`
  padding: 6px 0 0 0;
`;

const RouterLink = styled(Link)`
  position: relative;
  display: inline-block;
  padding: 10px 12px 10px 12px;
  font-size: ${(props) => props.theme.linkFontSize};
  text-decoration: none;
  color: ${(props) => props.theme.mainText};

  :hover,
  :focus {
    background-color: ${(props) => props.theme.backgroundHover};
  }
`;

const StyledRoutes = styled.div`
  display: flex;
  flex-direction: column;
`;
