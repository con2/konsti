import React, { ReactElement, useEffect, useState } from "react";
import { useStore } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import styled from "styled-components";
import { AppRoutes } from "client/app/AppRoutes";
import { Header } from "client/components/Header";
import { loadData } from "client/utils/loadData";
import { Loading } from "client/components/Loading";
import { getIconLibrary } from "client/utils/icons";
import { config } from "client/config";
import { ErrorBar } from "client/components/ErrorBar";
import { ProgramTypeSelection } from "client/components/EventTypeSelection";
import { useAppSelector } from "client/utils/hooks";
import { MOBILE_MARGIN } from "client/globalStyle";
import { newUpdatePageReloadKey } from "client/utils/localStorage";
import { isAdmin } from "client/utils/checkUserGroup";
import { timeFormatter } from "client/utils/timeFormatter";

const { loadedSettings, showTestValues } = config;

export const App = (): ReactElement => {
  const { dataUpdateInterval } = config;
  const store = useStore();

  const [loading, setLoading] = useState<boolean>(true);

  const appOpen = useAppSelector((state) => state.admin.appOpen);
  const userGroup = useAppSelector((state) => state.login.userGroup);
  const testTime = useAppSelector((state) => state.testSettings.testTime);

  useEffect(() => {
    // Successful app load -> reset update reload state
    localStorage.removeItem(newUpdatePageReloadKey);

    setLoading(true);
    const fetchData = async (): Promise<void> => {
      await loadData();
      setLoading(false);
    };
    fetchData();

    const startUpdateTimer = (): void => {
      /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
      setInterval(async () => await fetchData(), dataUpdateInterval * 1000);
    };
    startUpdateTimer();
  }, [store, dataUpdateInterval]);

  getIconLibrary();

  return (
    <>
      {loading && <Loading />}

      {!loading && (
        <BrowserRouter>
          {loadedSettings !== "production" && showTestValues && (
            <TestTime>{timeFormatter.getTime(testTime)}</TestTime>
          )}
          <Header />
          <ErrorBar />
          {(appOpen || isAdmin(userGroup)) && <ProgramTypeSelection />}
          <AppContainer>
            <AppRoutes />
          </AppContainer>
        </BrowserRouter>
      )}
    </>
  );
};

const AppContainer = styled.div`
  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    margin-left: ${MOBILE_MARGIN}px;
    margin-right: ${MOBILE_MARGIN}px;
  }

  @media (max-width: ${(props) => props.theme.breakpointDesktop}) {
    margin-left: ${MOBILE_MARGIN}px;
    margin-right: ${MOBILE_MARGIN}px;
  }
`;

const TestTime = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  font-size: 30px;
  color: red;

  @media (max-width: ${(props) => props.theme.breakpointDesktop}) {
    display: none;
  }
`;

export default App;
