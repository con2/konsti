import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAppSelector } from "client/utils/hooks";
import { config } from "shared/config";
import { isAdmin, isAdminOrHelp, isUser } from "client/utils/checkUserGroup";

export const LoggedInUserNavigation = (props: {
  onSelect: () => void;
}): ReactElement => {
  const { t } = useTranslation();
  const userGroup = useAppSelector((state) => state.login.userGroup);
  const eventLogItems = useAppSelector((state) => state.login.eventLogItems);
  const unseenEvents = eventLogItems.filter((item) => !item.isSeen);

  return (
    <StyledRoutes>
      <RouterLink onClick={props.onSelect} to="/program">
        {t("pages.program")}
      </RouterLink>

      {isUser(userGroup) && (
        <RouterLink onClick={props.onSelect} to="/notifications">
          {t("pages.notifications")}
          {unseenEvents.length > 0 && (
            <EventNumberContainer
              className="fa-layers fa-fw"
              aria-label={t("iconAltText.newNotifications")}
            >
              <EventNumberIcon icon="circle" className="fa-stack-1x" />
              <EventNumber className="fa-stack-1x">
                {unseenEvents.length}
              </EventNumber>
            </EventNumberContainer>
          )}
        </RouterLink>
      )}

      <RouterLink onClick={props.onSelect} to="/results">
        {t("pages.results")}
      </RouterLink>

      {isUser(userGroup) && config.shared().enableGroups && (
        <RouterLink onClick={props.onSelect} to="/profile">
          {t("pages.profileAndGroup")}
        </RouterLink>
      )}

      {isUser(userGroup) && !config.shared().enableGroups && (
        <RouterLink onClick={props.onSelect} to="/profile">
          {t("pages.profile")}
        </RouterLink>
      )}

      {isAdminOrHelp(userGroup) && (
        <>
          <RouterLink onClick={props.onSelect} to="/help">
            {t("button.helper")}
          </RouterLink>
          <RouterLink onClick={props.onSelect} to="/profile">
            {t("pages.profile")}
          </RouterLink>
        </>
      )}

      {isAdmin(userGroup) && (
        <RouterLink onClick={props.onSelect} to="/admin">
          {t("pages.admin")}
        </RouterLink>
      )}

      <RouterLink onClick={props.onSelect} to="/about/help">
        {t("pages.help")}
      </RouterLink>

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
  color: ${(props) => props.theme.textMain};
  border-bottom: 1px solid black;

  &:hover {
    background: ${(props) => props.theme.backgroundHover};
  }

  &:focus,
  &.active {
    background: ${(props) => props.theme.backgroundSelected};
  }
`;

const StyledRoutes = styled.div`
  display: flex;
  flex-direction: column;
`;

const EventNumberContainer = styled.span`
  margin: 0 0 0 6px;
  vertical-align: text-bottom;
`;

const EventNumberIcon = styled(FontAwesomeIcon)`
  color: ${(props) => props.theme.iconDefault};
  font-size: ${(props) => props.theme.iconSizeLarge};
`;

const EventNumber = styled.span`
  color: ${(props) => props.theme.buttonPrimaryText};
  font-size: ${(props) => props.theme.iconSizeSmall};
  left: 7px;
  top: 1px;
`;
