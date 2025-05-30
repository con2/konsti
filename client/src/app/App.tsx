import { ReactElement, useEffect, useState } from "react";
import { BrowserRouter } from "react-router";
import styled from "styled-components";
import { AppRoutes } from "client/app/AppRoutes";
import { Header } from "client/components/Header";
import { loadData } from "client/utils/loadData";
import { Loading } from "client/components/Loading";
import { getIconLibrary } from "client/utils/icons";
import { config } from "shared/config";
import { ErrorBar } from "client/components/ErrorBar";
import { MOBILE_MARGIN } from "client/globalStyle";
import { TestTime } from "client/test/test-components/TestTime";
import { Announcement } from "client/components/Announcement";
import { NotificationBar } from "client/views/event-log/NotificationBar";
import { resetNetworkError } from "client/views/admin/adminUtils";
import { HistoryProvider } from "client/app/HistoryContext";

const { loadedSettings, showTestValues, showAnnouncement, dataUpdateInterval } =
  config.client();

export const App = (): ReactElement => {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const fetchData = async (): Promise<void> => {
      await loadData();
      setLoading(false);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchData();

    const startUpdateTimer = (): void => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      setInterval(async () => {
        resetNetworkError();
        await fetchData();
      }, dataUpdateInterval * 1000);
    };
    startUpdateTimer();
  }, []);

  getIconLibrary();

  return (
    <>
      {loading && <Loading />}

      {!loading && (
        <BrowserRouter>
          <HistoryProvider>
            {loadedSettings !== "production" && showTestValues && <TestTime />}
            <Header />
            <ErrorBar />
            <NotificationBar />
            {showAnnouncement && <Announcement />}
            <AppContainer>
              <AppRoutes />
            </AppContainer>
          </HistoryProvider>
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
