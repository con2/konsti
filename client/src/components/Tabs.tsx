import React, { ReactElement } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import styled from "styled-components";

interface TabContent {
  headerText: string;
  path: string;
  element: React.ReactNode;
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
              <Link to={t.path}>{t.headerText}</Link>
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
`;

const TabsList = styled.ul`
  list-style-type: none;
  margin-left: 0;
`;

const ListItem = styled.li`
  float: left;
  padding-right: 16px;
`;

const Link = styled(NavLink)`
  text-decoration: none;
  font-size: ${(props) => props.theme.linkFontSize};
`;
