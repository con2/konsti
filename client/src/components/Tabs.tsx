import { ReactElement } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import styled from "styled-components";
import { IconName } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface TabContent {
  headerText: string;
  path: string;
  element: React.ReactNode;
  icon?: IconName;
}

interface Props {
  tabContents: TabContent[];
}

export const Tabs = ({ tabContents }: Props): ReactElement => {
  return (
    <>
      <TabsNav>
        <TabsList>
          {tabContents.map((t) => (
            <ListItem key={t.headerText}>
              <StyledLink to={t.path}>
                {t.icon && <StyledIcon icon={t.icon} aria-hidden={true} />}
                {t.headerText}
              </StyledLink>
            </ListItem>
          ))}
        </TabsList>
      </TabsNav>
      <Routes>
        <Route
          path={""}
          element={<Navigate to={tabContents[0].path} replace={true} />}
        />
        {tabContents.map((t) => (
          <Route path={t.path} element={t.element} key={t.path} />
        ))}
      </Routes>
    </>
  );
};

const TabsNav = styled.nav`
  display: flex;
  border-bottom: 1px solid ${(props) => props.theme.tabBorder};
  padding-bottom: 6px;
`;

const TabsList = styled.ul`
  list-style-type: none;
  margin-left: 0;
`;

const ListItem = styled.li`
  float: left;
  padding-right: 16px;

  @media (min-width: ${(props) => props.theme.breakpointDesktop}) {
    padding-right: 24px;
  }
`;

const StyledLink = styled(NavLink)`
  text-decoration: none;
  font-size: ${(props) => props.theme.fontSizeLarge};
  color: ${(props) => props.theme.textInactiveTab};
  padding-bottom: 4px;

  &.active {
    color: ${(props) => props.theme.textActiveTab};
    border-bottom: 3px solid ${(props) => props.theme.textActiveTab};
  }
`;

const StyledIcon = styled(FontAwesomeIcon)`
  font-size: ${(props) => props.theme.iconSizeNormal};
  margin-right: 6px;
`;
