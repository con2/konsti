import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { useAppSelector } from 'client/utils/hooks';

export const LoggedInUserNavigation = (props: {
  onSelect: () => void;
}): ReactElement => {
  const userGroup = useAppSelector((state) => state.login.userGroup);
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

const RouterLink = styled(NavLink)`
  position: relative;
  display: inline-block;
  padding: 10px 12px 10px 12px;
  font-size: ${(props) => props.theme.linkFontSize};
  text-decoration: none;
  color: ${(props) => props.theme.mainText};
  border-bottom: 1px solid black;

  :hover,
  :focus,
  &.active {
    background-color: ${(props) => props.theme.backgroundHover};
  }
`;

const StyledRoutes = styled.div`
  display: flex;
  flex-direction: column;
`;
