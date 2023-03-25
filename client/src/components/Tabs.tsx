import React, { ReactElement } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";

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
    <div>
      <nav>
        <ul>
          {tabContents.map((t) => (
            <li key={t.headerText}>
              <NavLink to={t.path}>{t.headerText}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Routes>
        <Route
          path={""}
          element={<Navigate to={tabContents[0].path} replace={true} />}
        />
        {tabContents.map((t) => (
          <Route path={t.path} element={t.element} key={t.path} />
        ))}
      </Routes>
    </div>
  );
};
