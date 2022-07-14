import React, { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LoggedInUserNavigation } from "./LoggedInUserNavigation";
import { UserNavigation } from "./UserNavigation";
import { useAppSelector } from "client/utils/hooks";
import { HEADER_HEIGHT } from "client/components/Header";
import { config } from "client/config";
import { TestValuePicker } from "client/components/TestValuePicker";

export const Navigation = (): ReactElement => {
  const username = useAppSelector((state) => state.login.username);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const serial = useAppSelector((state) => state.login.serial);
  const { t } = useTranslation();
  const { loadedSettings, showTestValues } = config;

  const [isOpen, setIsOpen] = useState(false);

  const icon = isOpen ? "times" : "bars";
  return (
    <>
      <NavigationIconContainer>
        <NavigationIcon
          icon={icon}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={t("iconAltText.openNavigation")}
          data-testid="navigation-icon"
        />
      </NavigationIconContainer>
      {isOpen && <Dimmer onClick={() => setIsOpen(false)} />}
      {isOpen && (
        <Drawer>
          {loggedIn ? (
            <LoggedInUserNavigation onSelect={() => setIsOpen(false)} />
          ) : (
            <UserNavigation onSelect={() => setIsOpen(false)} />
          )}

          {loadedSettings !== "production" && showTestValues && (
            <TestValuePicker />
          )}

          {loggedIn && (
            <LoggedUserDetails>
              <UserInfo data-testid="logged-user-username">
                {t("user")}: {username}
              </UserInfo>
              <UserInfo data-testid="logged-user-serial">
                {t("code")}: {serial}
              </UserInfo>
            </LoggedUserDetails>
          )}
        </Drawer>
      )}
    </>
  );
};

const NavigationIcon = styled(FontAwesomeIcon)`
  color: black;
`;

const NavigationIconContainer = styled.span`
  margin: 0 8px;
  font-size: 30px;
  width: 32px;
  height: 32px;
`;

const Dimmer = styled.div`
  position: absolute;
  top: ${() => HEADER_HEIGHT}px;
  left: 0;
  right: 0;
  bottom: 0;
  background: black;
  opacity: 0.7;
  z-index: 90;
`;

const Drawer = styled.div`
  position: absolute;
  top: ${() => HEADER_HEIGHT}px;
  bottom: 0;
  width: 60%;
  z-index: 100;
  border-right: 1px solid black;
  color: black;
  background: ${(props) => props.theme.backgroundHighlight};
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
