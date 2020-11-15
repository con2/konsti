import React, { ReactElement, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { RootState } from 'typings/redux.typings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
`;

const LoggedUserDetails = styled.div`
  display: flex;
  flex: 0 1 auto;
  flex-direction: column;
`;

const UserInfo = styled.span`
  padding: 6px 0 0 0;
`;
