import React, { ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { config } from 'client/config';
import { LoggedInUserNavigation } from './LoggedInUserNavigation';
import { UserNavigation } from './UserNavigation';
import { useAppSelector } from 'client/utils/hooks';

export const Navigation = (): ReactElement => {
  const username = useAppSelector((state) => state.login.username);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const serial = useAppSelector((state) => state.login.serial);
  const { t } = useTranslation();
  const { loadedSettings, useTestTime } = config;

  const [isOpen, setIsOpen] = useState(false);

  const icon = isOpen ? 'times' : 'bars';
  return (
    <>
      <NavigationIconContainer>
        <NavigationIcon
          icon={icon}
          onClick={() => setIsOpen(!isOpen)}
          data-testkey='navigation-icon'
        />
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
              <UserInfo data-testkey='logged-user-username'>
                {t('user')}: {username}
              </UserInfo>
              <UserInfo data-testkey='logged-user-serial'>
                {t('code')}: {serial}
              </UserInfo>
            </LoggedUserDetails>
          )}
        </Drawer>
      )}
    </>
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
  margin-top: 24px;
  text-align: center;
`;

const UserInfo = styled.span`
  padding: 6px 0 0 0;
`;
