import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import { useAppSelector } from "client/utils/hooks";
import { sharedConfig } from "shared/config/sharedConfig";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { isAdmin, isAdminOrHelp, isUser } from "client/utils/checkUserGroup";

export const LoggedInUserNavigation = (props: {
  onSelect: () => void;
}): ReactElement => {
  const userGroup = useAppSelector((state) => state.login.userGroup);
  const { t } = useTranslation();

  return (
    <StyledRoutes>
      <RouterLink onClick={props.onSelect} to="/games">
        {t("pages.allGames")}
      </RouterLink>

      {isUser(userGroup) && (
        <RouterLink onClick={props.onSelect} to="/mygames">
          {t("pages.myGames")}
        </RouterLink>
      )}

      {isUser(userGroup) &&
        sharedConfig.signupStrategy === SignupStrategy.ALGORITHM && (
          <RouterLink onClick={props.onSelect} to="/signup">
            {t("pages.signUp")}
          </RouterLink>
        )}

      <RouterLink onClick={props.onSelect} to="/results">
        {t("pages.results")}
      </RouterLink>

      {isUser(userGroup) && sharedConfig.enableGroups && (
        <RouterLink onClick={props.onSelect} to="/group">
          {t("pages.group")}
        </RouterLink>
      )}

      {isAdminOrHelp(userGroup) && (
        <RouterLink onClick={props.onSelect} to="/help">
          {t("button.helper")}
        </RouterLink>
      )}

      {isAdmin(userGroup) && (
        <RouterLink onClick={props.onSelect} to="/admin">
          {t("pages.admin")}
        </RouterLink>
      )}

      <RouterLink onClick={props.onSelect} to="/logout">
        {t("button.logout")}
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
    background: ${(props) => props.theme.backgroundHover};
  }
`;

const StyledRoutes = styled.div`
  display: flex;
  flex-direction: column;
`;
