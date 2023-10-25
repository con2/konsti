import { ReactElement, useEffect, useState } from "react";
import { useStore } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import styled from "styled-components";
import { AppRoutes } from "client/app/AppRoutes";
import { Header } from "client/components/Header";
import { loadData } from "client/utils/loadData";
import { Loading } from "client/components/Loading";
import { getIconLibrary } from "client/utils/icons";
import { getClientConfig } from "shared/config/clientConfig";
import { ErrorBar } from "client/components/ErrorBar";
import { MOBILE_MARGIN } from "client/globalStyle";
import { TestTime } from "client/test/test-components/TestTime";
import { Announcement } from "client/components/Announcement";
import { NotificationBar } from "client/components/NotificationBar";

const { loadedSettings, showTestValues, showAnnouncement, dataUpdateInterval } =
  getClientConfig();

export const App = (): ReactElement => {
  const store = useStore();

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
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
  }, [store]);

  getIconLibrary();

  return (
    <>
      {loading && <Loading />}

      {!loading && (
        <BrowserRouter>
          {loadedSettings !== "production" && showTestValues && <TestTime />}
          <Header />
          <ErrorBar />
          <NotificationBar />
          {showAnnouncement && <Announcement />}
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
