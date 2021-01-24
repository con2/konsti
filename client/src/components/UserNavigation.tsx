import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';

export const UserNavigation = (props: {
  onSelect: () => void;
}): ReactElement => {
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
