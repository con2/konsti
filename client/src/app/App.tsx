import { ReactElement, useEffect, useState } from "react";
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
import { TestTime } from "client/components/TestTime";
import { sharedConfig } from "shared/config/sharedConfig";
import { Announcement } from "client/components/Announcement";

const { loadedSettings, showTestValues, showAnnouncement } = config;

export const App = (): ReactElement => {
  const { dataUpdateInterval } = config;
  const store = useStore();

  const [loading, setLoading] = useState<boolean>(true);

  const appOpen = useAppSelector((state) => state.admin.appOpen);
  const userGroup = useAppSelector((state) => state.login.userGroup);

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

  const showProgramTypeSelection =
    (appOpen || isAdmin(userGroup)) &&
    sharedConfig.activeProgramTypes.length > 1;

  return (
    <>
      {loading && <Loading />}

      {!loading && (
        <BrowserRouter>
          {loadedSettings !== "production" && showTestValues && <TestTime />}
          <Header />
          <ErrorBar />
          {showAnnouncement && <Announcement />}
          {showProgramTypeSelection && <ProgramTypeSelection />}
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

export default App;
