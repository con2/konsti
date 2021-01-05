import React, { ReactElement, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { RootState } from 'typings/redux.typings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import { UserGroup } from 'typings/user.typings';
import { config } from 'config';

export const Navigation = (): ReactElement => {
  const username: string = useSelector(
    (state: RootState) => state.login.username
  );
  const loggedIn: boolean = useSelector(
    (state: RootState) => state.login.loggedIn
  );
  const serial: string = useSelector((state: RootState) => state.login.serial);
  const { t } = useTranslation();
  const { loadedSettings, useTestTime } = config;

  const [isOpen, setIsOpen] = useState(false);

  const icon = isOpen ? 'times' : 'bars';
  return (
    <>
      <NavigationIconContainer>
        <NavigationIcon icon={icon} onClick={() => setIsOpen(!isOpen)} />
      </NavigationIconContainer>
      {isOpen && (
        <Dimmer
          onClick={() => setIsOpen(false)}
          includeTimeSelectorHeight={
            loadedSettings !== 'production' && useTestTime
          }
        />
      )}
      {isOpen && (
        <Drawer
          includeTimeSelectorHeight={
            loadedSettings !== 'production' && useTestTime
          }
        >
          {loggedIn ? (
            <LoggedInUserNavigation onSelect={() => setIsOpen(false)} />
          ) : (
            <UserNavigation onSelect={() => setIsOpen(false)} />
          )}
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
        </Drawer>
      )}
    </>
  );
};

const LoggedInUserNavigation = (props: {
  onSelect: () => void;
}): ReactElement => {
  const userGroup: UserGroup = useSelector(
    (state: RootState) => state.login.userGroup
  );
  const { t } = useTranslation();

  return (
    <StyledRoutes>
      <RouterLink onClick={props.onSelect} to='/games'>
        {t('pages.allGames')}
      </RouterLink>

      {userGroup === 'user' && (
        <RouterLink onClick={props.onSelect} to='/mygames'>
          {t('pages.myGames')}
        </RouterLink>
      )}

      {userGroup === 'user' && (
        <RouterLink onClick={props.onSelect} to='/signup'>
          {t('pages.signUp')}
        </RouterLink>
      )}

      {(userGroup === 'user' ||
        userGroup === 'admin' ||
        userGroup === 'help') && (
        <RouterLink onClick={props.onSelect} to='/results'>
          {t('pages.results')}
        </RouterLink>
      )}

      {userGroup === 'user' && (
        <RouterLink onClick={props.onSelect} to='/group'>
          {t('pages.group')}
        </RouterLink>
      )}

      {(userGroup === 'help' || userGroup === 'admin') && (
        <RouterLink onClick={props.onSelect} to='/help'>
          {t('button.helper')}
        </RouterLink>
      )}

      {userGroup === 'admin' && (
        <RouterLink onClick={props.onSelect} to='/admin'>
          {t('pages.admin')}
        </RouterLink>
      )}

      {(userGroup === 'user' ||
        userGroup === 'admin' ||
        userGroup === 'help') && (
        <RouterLink onClick={props.onSelect} to='/logout'>
          {t('button.logout')}
        </RouterLink>
      )}
    </StyledRoutes>
  );
};

const UserNavigation = (props: { onSelect: () => void }): ReactElement => {
  const { t } = useTranslation();

  return (
    <StyledRoutes>
      <RouterLink onClick={props.onSelect} to='/games'>
        {t('pages.allGames')}
      </RouterLink>

      <RouterLink onClick={props.onSelect} to='/login'>
        {t('button.login')}
      </RouterLink>

      <RouterLink onClick={props.onSelect} to='/registration'>
        {t('button.register')}
      </RouterLink>
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

const Dimmer = styled.div<{ includeTimeSelectorHeight: boolean }>`
  position: absolute;
  top: ${(props) => (props.includeTimeSelectorHeight ? 40 + 50 : 40)}px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: black;
  opacity: 0.7;
`;

const Drawer = styled.div<{ includeTimeSelectorHeight: boolean }>`
  background-color: white;
  position: absolute;
  top: ${(props) => (props.includeTimeSelectorHeight ? 40 + 50 : 40)}px;
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
  border-bottom: 1px solid black;

  :hover,
  :focus {
    background-color: ${(props) => props.theme.backgroundHover};
  }
`;

const StyledRoutes = styled.div`
  display: flex;
  flex-direction: column;
`;
